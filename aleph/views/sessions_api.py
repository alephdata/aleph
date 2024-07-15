import logging
from urllib.parse import urlencode
from flask_babel import gettext
from flask import Blueprint, redirect, request, session
from authlib.common.errors import AuthlibBaseError
from werkzeug.exceptions import Unauthorized, BadRequest
from prometheus_client import Counter

from aleph.settings import SETTINGS
from aleph.core import db, url_for, cache
from aleph.authz import Authz
from aleph.oauth import oauth, handle_oauth, OAuthError
from aleph.model import Role, PasswordCredentialsError, RoleBlockedError
from aleph.logic.util import ui_url
from aleph.logic.roles import update_role
from aleph.views.util import get_url_path, parse_request
from aleph.views.util import require, jsonify

log = logging.getLogger(__name__)
blueprint = Blueprint("sessions_api", __name__)

AUTH_ATTEMPS = Counter(
    "aleph_auth_attemps_total",
    "Total number of successful/failed authentication attemps",
    ["method", "result"],
)


def _oauth_session(token):
    return cache.key("oauth-sess", token)


def _token_session(token):
    return cache.key("oauth-id-tok", token)


@blueprint.route("/api/2/sessions/login", methods=["POST"])
def password_login():
    """Provides email and password authentication.
    ---
    post:
      summary: Log in as a user
      description: Create a session token using a username and password.
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Login'
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
                  token:
                    type: string
      tags:
      - Role
    """
    require(SETTINGS.PASSWORD_LOGIN)
    data = parse_request("Login")
    try:
        role = Role.login(data.get("email"), data.get("password"))
    except PasswordCredentialsError:
        AUTH_ATTEMPS.labels(method="password", result="failed").inc()
        # Raising a 400 error in this and the following case is technically
        # not 100% correct. This seems to have been introduced in order to simplify
        # error handling in the frontend. Raising a 401 error triggers a
        # hard page reload and state invalidation etc.
        raise BadRequest(gettext("Invalid user or password."))
    except RoleBlockedError:
        AUTH_ATTEMPS.labels(method="password", result="failed").inc()
        return jsonify(
            {
                "status": "error",
                "message": "Your account has been blocked.",
            },
            status=403,
        )

    role.touch()
    db.session.commit()
    AUTH_ATTEMPS.labels(method="password", result="success").inc()
    update_role(role)
    authz = Authz.from_role(role)
    return jsonify({"status": "ok", "token": authz.to_token()})


@blueprint.route("/api/2/sessions/oauth")
def oauth_init():
    """Init OAuth auth flow.
    ---
    get:
      summary: Start OAuth authentication
      description: Initiate a forward to the OAuth server.
      responses:
        '302':
          description: Redirect
      tags:
      - Role
    """
    require(SETTINGS.OAUTH)
    url = url_for(".oauth_callback")
    state = oauth.provider.create_authorization_url(url)
    state["next_url"] = request.args.get("next", request.referrer)
    state["redirect_uri"] = url
    cache.set_complex(_oauth_session(state.get("state")), state, expires=3600)
    return redirect(state["url"])


@blueprint.route("/api/2/sessions/callback")
def oauth_callback():
    require(SETTINGS.OAUTH)
    err = Unauthorized(gettext("Authentication has failed."))
    state = cache.get_complex(_oauth_session(request.args.get("state")))
    if state is None:
        AUTH_ATTEMPS.labels(method="oauth", result="failed").inc()
        raise err

    try:
        oauth.provider.framework.set_session_data(request, "state", state.get("state"))
        uri = state.get("redirect_uri")
        oauth_token = oauth.provider.authorize_access_token(redirect_uri=uri)
    except AuthlibBaseError as err:
        AUTH_ATTEMPS.labels(method="oauth", result="failed").inc()
        log.warning("Failed OAuth: %r", err)
        raise err
    if oauth_token is None or isinstance(oauth_token, AuthlibBaseError):
        AUTH_ATTEMPS.labels(method="oauth", result="failed").inc()
        log.warning("Failed OAuth: %r", oauth_token)
        raise err

    try:
        role = handle_oauth(oauth.provider, oauth_token)
    except OAuthError:
        AUTH_ATTEMPS.labels(method="oauth", result="failed").inc()
        raise err
    except RoleBlockedError:
        error_url = ui_url("oauth", status="error", code=403)
        return redirect(error_url)

    db.session.commit()
    update_role(role)
    AUTH_ATTEMPS.labels(method="oauth", result="success").inc()
    log.debug("Logged in: %r", role)
    request.authz = Authz.from_role(role)
    token = request.authz.to_token()

    # Store id_token to generate logout URL later
    id_token = oauth_token.get("id_token")
    if id_token is not None:
        cache.set(_token_session(token), id_token, expires=SETTINGS.SESSION_EXPIRE)

    next_path = get_url_path(state.get("next_url"))
    next_url = ui_url("oauth", next=next_path)
    next_url = f"{next_url}#token={token}"
    session.clear()
    return redirect(next_url)


@blueprint.route("/api/2/sessions/logout", methods=["POST"])
def logout():
    """Destroy the current authz session (state).
    ---
    post:
      summary: Destroy the current state.
      responses:
        '200':
          description: Done
      tags:
      - Role
    """
    request.rate_limit = None
    redirect_url = SETTINGS.APP_UI_URL
    if SETTINGS.OAUTH:
        metadata = oauth.provider.load_server_metadata()
        logout_endpoint = metadata.get("end_session_endpoint")
        if logout_endpoint is not None:
            query = {
                "post_logout_redirect_uri": redirect_url,
                "id_token_hint": cache.get(_token_session(request.authz.token_id)),
            }
            redirect_url = logout_endpoint + "?" + urlencode(query)
    request.authz.destroy()
    return jsonify({"redirect": redirect_url})
