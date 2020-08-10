import logging
from babel import Locale
from functools import lru_cache
from collections import defaultdict
from flask import Blueprint, request, current_app
from flask_babel import gettext, get_locale
from elasticsearch import TransportError
from followthemoney import model
from followthemoney.exc import InvalidData
from jwt import ExpiredSignatureError, DecodeError

from aleph import __version__
from aleph.core import settings, url_for
from aleph.authz import Authz
from aleph.model import Collection, Role
from aleph.logic import resolver
from aleph.logic.pages import load_pages
from aleph.index.collections import get_collection_things
from aleph.validation import get_openapi_spec
from aleph.views.context import enable_cache, NotModified
from aleph.views.util import jsonify

blueprint = Blueprint("base_api", __name__)
log = logging.getLogger(__name__)


@lru_cache(maxsize=None)
def _metadata_locale(locale):
    # This is cached in part because latency on this endpoint is
    # particularly relevant to the first render being shown to a
    # user.
    auth = {}
    if settings.PASSWORD_LOGIN:
        auth["password_login_uri"] = url_for("sessions_api.password_login")
        auth["registration_uri"] = url_for("roles_api.create_code")
    if settings.OAUTH:
        auth["oauth_uri"] = url_for("sessions_api.oauth_init")

    locales = settings.UI_LANGUAGES
    locales = {l: Locale(l).get_language_name(l) for l in locales}

    data = {
        "status": "ok",
        "maintenance": request.authz.in_maintenance,
        "app": {
            "title": settings.APP_TITLE,
            "description": settings.APP_DESCRIPTION,
            "version": __version__,
            "banner": settings.APP_BANNER,
            "ui_uri": settings.APP_UI_URL,
            "samples": settings.SAMPLE_SEARCHES,
            "logo": settings.APP_LOGO,
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

    if settings.SINGLE_USER:
        role = Role.load_cli_user()
        authz = Authz.from_role(role)
        data["token"] = authz.to_token(role=role)
    return jsonify(data)


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
    locale = str(get_locale())
    return _metadata_locale(locale)


@blueprint.route("/api/openapi.json")
def openapi():
    """Generate an OpenAPI 3.0 documentation JSON file for the API."""
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
    """Get a summary of the data acessible to the current user.
    ---
    get:
      summary: System-wide user statistics.
      description: >
        Get a summary of the data acessible to the current user.
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
    enable_cache()
    collections = request.authz.collections(request.authz.READ)
    for collection_id in collections:
        resolver.queue(request, Collection, collection_id)
    resolver.resolve(request)

    # Summarise stats. This is meant for display, so the counting is a bit
    # inconsistent between counting all collections, and source collections
    # only.
    schemata = defaultdict(int)
    countries = defaultdict(int)
    categories = defaultdict(int)
    for collection_id in collections:
        data = resolver.get(request, Collection, collection_id)
        if data is None or data.get("casefile"):
            continue
        categories[data.get("category")] += 1
        things = get_collection_things(collection_id)
        for schema, count in things.items():
            schemata[schema] += count
        for country in data.get("countries", []):
            countries[country] += 1

    return jsonify(
        {
            "collections": len(collections),
            "schemata": dict(schemata),
            "countries": dict(countries),
            "categories": dict(categories),
            "things": sum(schemata.values()),
        }
    )


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
    data = {"status": "error", "errors": gettext("Access token is invalid.")}
    return jsonify(data, status=401)


@blueprint.app_errorhandler(TransportError)
def handle_es_error(err):
    message = err.error
    if hasattr(err, "info") and isinstance(err.info, dict):
        error = err.info.get("error", {})
        for root_cause in error.get("root_cause", []):
            message = root_cause.get("reason", message)
    return jsonify({"status": "error", "message": message}, status=err.status_code)
