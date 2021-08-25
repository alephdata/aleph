import logging
from babel import Locale
from functools import lru_cache
from flask import Blueprint, request, current_app
from flask_babel import gettext, get_locale
from elasticsearch import TransportError
from followthemoney import model
from followthemoney.exc import InvalidData
from jwt import ExpiredSignatureError, DecodeError

from aleph import __version__
from aleph.core import settings, url_for, cache, archive
from aleph.authz import Authz
from aleph.model import Collection, Role
from aleph.logic.pages import load_pages
from aleph.logic.util import collection_url
from aleph.validation import get_openapi_spec
from aleph.views.context import enable_cache, NotModified
from aleph.views.util import jsonify, render_xml

blueprint = Blueprint("base_api", __name__)
log = logging.getLogger(__name__)


@lru_cache(maxsize=None)
def _metadata_locale(locale):
    # This is cached in part because latency on this endpoint is
    # particularly relevant to the first render being shown to a
    # user.
    auth = {"oauth": settings.OAUTH, "require_logged_in": settings.REQUIRE_LOGGED_IN}
    if settings.PASSWORD_LOGIN:
        auth["password_login_uri"] = url_for("sessions_api.password_login")
    if settings.PASSWORD_LOGIN and not settings.MAINTENANCE:
        auth["registration_uri"] = url_for("roles_api.create_code")
    if settings.OAUTH:
        auth["oauth_uri"] = url_for("sessions_api.oauth_init")
    locales = settings.UI_LANGUAGES
    locales = {loc: Locale(loc).get_language_name(loc) for loc in locales}

    # This is dumb but we agreed it with ARIJ
    # https://github.com/alephdata/aleph/issues/1432
    app_logo = settings.APP_LOGO
    if locale.startswith("ar"):
        app_logo = settings.APP_LOGO_AR or app_logo

    return {
        "status": "ok",
        "maintenance": settings.MAINTENANCE,
        "app": {
            "title": settings.APP_TITLE,
            "version": __version__,
            "banner": settings.APP_BANNER,
            "ui_uri": settings.APP_UI_URL,
            "publish": archive.can_publish,
            "logo": app_logo,
            "favicon": settings.APP_FAVICON,
            "locale": locale,
            "locales": locales,
        },
        "categories": Collection.CATEGORIES,
        "frequencies": Collection.FREQUENCIES,
        "pages": load_pages(locale),
        "model": model.to_dict(),
        "token": None,
        "auth": auth,
    }


@blueprint.route("/api/2/metadata")
def metadata():
    """Get operational metadata for the frontend.
    ---
    get:
      summary: Retrieve system metadata from the application.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
      tags:
      - System
    """
    request.rate_limit = None
    locale = str(get_locale())
    data = _metadata_locale(locale)
    if settings.SINGLE_USER:
        role = Role.load_cli_user()
        authz = Authz.from_role(role)
        data["token"] = authz.to_token()
    return jsonify(data)


@blueprint.route("/api/openapi.json")
def openapi():
    """Generate an OpenAPI 3.0 documentation JSON file for the API."""
    enable_cache(vary_user=False)
    spec = get_openapi_spec(current_app)
    for name, view in current_app.view_functions.items():
        if name in (
            "static",
            "base_api.openapi",
            "base_api.api_v1_message",
            "sessions_api.oauth_callback",
        ):
            continue
        log.info("%s - %s", name, view.__qualname__)
        spec.path(view=view)
    return jsonify(spec.to_dict())


@blueprint.route("/api/2/statistics")
def statistics():
    """Get a summary of the data acessible to an anonymous user.

    Changed [3.9]: Previously, this would return user-specific stats.
    ---
    get:
      summary: System-wide user statistics.
      description: >
        Get a summary of the data acessible to an anonymous user.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
      tags:
      - System
    """
    enable_cache(vary_user=False)
    key = cache.key(cache.STATISTICS)
    data = {"countries": [], "schemata": [], "categories": []}
    data = cache.get_complex(key) or data
    return jsonify(data)


@blueprint.route("/api/2/sitemap.xml")
def sitemap():
    """
    ---
    get:
      summary: Get a sitemap
      description: >-
        Returns a site map for search engine robots. This lists each
        published collection on the current instance.
      responses:
        '200':
          description: OK
          content:
            text/xml:
              schema:
                type: object
      tags:
      - System
    """
    enable_cache(vary_user=False)
    request.rate_limit = None
    collections = []
    for collection in Collection.all_authz(Authz.from_role(None)):
        updated_at = collection.updated_at.date().isoformat()
        updated_at = max(settings.SITEMAP_FLOOR, updated_at)
        url = collection_url(collection.id)
        collections.append({"url": url, "updated_at": updated_at})
    return render_xml("sitemap.xml", collections=collections)


@blueprint.route("/healthz")
def healthz():
    """
    ---
    get:
      summary: Health check endpoint.
      description: >
        This can be used e.g. for Kubernetes health checks, but it doesn't
        do any internal checks.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: 'ok'
      tags:
      - System
    """
    request.rate_limit = None
    return jsonify({"status": "ok"})


@blueprint.app_errorhandler(NotModified)
def handle_not_modified(err):
    return ("", 304)


@blueprint.app_errorhandler(400)
def handle_bad_request(err):
    if err.response is not None and err.response.is_json:
        return err.response
    return jsonify({"status": "error", "message": err.description}, status=400)


@blueprint.app_errorhandler(403)
def handle_authz_error(err):
    return jsonify(
        {
            "status": "error",
            "message": gettext("You are not authorized to do this."),
            "roles": request.authz.roles,
        },
        status=403,
    )


@blueprint.app_errorhandler(404)
def handle_not_found_error(err):
    msg = gettext("This path does not exist.")
    return jsonify({"status": "error", "message": msg}, status=404)


@blueprint.app_errorhandler(500)
def handle_server_error(err):
    log.exception("%s: %s", type(err).__name__, err)
    msg = gettext("Internal server error.")
    return jsonify({"status": "error", "message": msg}, status=500)


@blueprint.app_errorhandler(InvalidData)
def handle_invalid_data(err):
    data = {"status": "error", "message": str(err), "errors": err.errors}
    return jsonify(data, status=400)


@blueprint.app_errorhandler(DecodeError)
@blueprint.app_errorhandler(ExpiredSignatureError)
def handle_jwt_expired(err):
    log.info("JWT Error: %s", err)
    data = {"status": "error", "errors": gettext("Access token is invalid.")}
    return jsonify(data, status=401)


@blueprint.app_errorhandler(TransportError)
def handle_es_error(err):
    message = err.error
    if hasattr(err, "info") and isinstance(err.info, dict):
        error = err.info.get("error", {})
        for root_cause in error.get("root_cause", []):
            message = root_cause.get("reason", message)
    try:
        # Sometimes elasticsearch-py generates non-numeric status codes like
        # "TIMEOUT", "N/A". Werkzeug converts them into status 0 which confuses
        # web browsers. Replace the weird status codes with 500 instead.
        status = int(err.status_code)
    except ValueError:
        status = 500
    return jsonify({"status": "error", "message": message}, status=status)
