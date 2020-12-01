import logging
from flask_babel import gettext
from flask import Blueprint, redirect, request, session
from authlib.common.errors import AuthlibBaseError
from werkzeug.exceptions import Unauthorized, BadRequest

from aleph import settings
from aleph.core import db, url_for, cache
from aleph.authz import Authz
from aleph.oauth import oauth, handle_oauth
from aleph.model import Role
from aleph.logic.util import ui_url
from aleph.logic.roles import update_role
from aleph.views.util import get_url_path, parse_request
from aleph.views.util import require, jsonify

log = logging.getLogger(__name__)
blueprint = Blueprint("sessions_api", __name__)


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
    require(settings.PASSWORD_LOGIN)
    data = parse_request("Login")
    role = Role.login(data.get("email"), data.get("password"))
    if role is None:
        raise BadRequest(gettext("Invalid user or password."))

    role.touch()
    db.session.commit()
    update_role(role)
    authz = Authz.from_role(role)
    return jsonify({"status": "ok", "token": authz.to_token()})


def _oauth_session(token):
    return cache.key("oauth-sess", token)


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
    require(settings.OAUTH)
    url = url_for(".oauth_callback")
    state = oauth.provider.create_authorization_url(url)
    state["next_url"] = request.args.get("next", request.referrer)
    state["redirect_uri"] = url
    cache.set_complex(_oauth_session(state.get("state")), state, expires=3600)
    return redirect(state["url"])


@blueprint.route("/api/2/sessions/callback")
def oauth_callback():
    require(settings.OAUTH)
    err = Unauthorized(gettext("Authentication has failed."))
    state = cache.get_complex(_oauth_session(request.args.get("state")))
    if state is None:
        raise err

    try:
        oauth.provider.framework.set_session_data(request, "state", state.get("state"))
        uri = state.get("redirect_uri")
        token = oauth.provider.authorize_access_token(redirect_uri=uri)
    except AuthlibBaseError as err:
        log.warning("Failed OAuth: %r", err)
        raise err
    if token is None or isinstance(token, AuthlibBaseError):
        log.warning("Failed OAuth: %r", token)
        raise err

    role = handle_oauth(oauth.provider, token)
    if role is None:
        raise err

    db.session.commit()
    update_role(role)
    log.debug("Logged in: %r", role)
    request.authz = Authz.from_role(role)
    next_path = get_url_path(state.get("next_url"))
    next_url = ui_url("oauth", next=next_path)
    next_url = "%s#token=%s" % (next_url, request.authz.to_token())
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
    request.authz.destroy()
    return ("", 202)
