import logging
from flask_babel import gettext
from flask import Blueprint, redirect, request
from authlib.common.errors import AuthlibBaseError
from werkzeug.exceptions import Unauthorized, BadRequest

from aleph import signals, settings
from aleph.core import db, url_for
from aleph.authz import Authz
from aleph.oauth import oauth
from aleph.model import Role
from aleph.logic.util import ui_url
from aleph.logic.roles import update_role
from aleph.views.forms import LoginSchema
from aleph.views.util import get_url_path, parse_request
from aleph.views.util import require, jsonify

log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


def _get_credential_authz(credential):
    if credential is None or not len(credential):
        return
    if ' ' in credential:
        _, credential = credential.split(' ', 1)
    authz = Authz.from_token(credential, scope=request.path)
    if authz is not None:
        return authz

    role = Role.by_api_key(credential)
    if role is not None:
        return Authz.from_role(role=role)


@blueprint.before_app_request
def decode_authz():
    authz = None

    if 'Authorization' in request.headers:
        credential = request.headers.get('Authorization')
        authz = _get_credential_authz(credential)

    if authz is None and 'api_key' in request.args:
        authz = _get_credential_authz(request.args.get('api_key'))

    authz = authz or Authz.from_role(role=None)
    request.authz = authz


@blueprint.route('/api/2/sessions/login', methods=['POST'])
def password_login():
    """Provides email and password authentication."""
    require(settings.PASSWORD_LOGIN)
    data = parse_request(LoginSchema)
    role = Role.by_email(data.get('email'))
    if role is None or not role.has_password:
        raise BadRequest(gettext("Invalid user or password."))

    if not role.check_password(data.get('password')):
        raise BadRequest(gettext("Invalid user or password."))

    db.session.commit()
    update_role(role)
    authz = Authz.from_role(role)
    request.authz = authz
    return jsonify({
        'status': 'ok',
        'token': authz.to_token(role=role)
    })


@blueprint.route('/api/2/sessions/oauth')
def oauth_init():
    require(settings.OAUTH)
    url = url_for('.oauth_callback')
    state = request.args.get('next', request.referrer)
    return oauth.provider.authorize_redirect(url, state=state)


@blueprint.route('/api/2/sessions/callback')
def oauth_callback():
    require(settings.OAUTH)
    token = oauth.provider.authorize_access_token()
    if token is None or isinstance(token, AuthlibBaseError):
        log.warning("Failed OAuth: %r", token)
        raise Unauthorized(gettext("Authentication has failed."))

    response = signals.handle_oauth_session.send(provider=oauth.provider,
                                                 oauth=token)
    for (_, role) in response:
        if role is None:
            continue
        db.session.commit()
        update_role(role)
        log.info("Logged in: %r", role)
        request.authz = Authz.from_role(role)
        token = request.authz.to_token(role=role)
        token = token.decode('utf-8')
        next_path = get_url_path(request.args.get('state'))
        next_url = ui_url(settings.OAUTH_UI_CALLBACK, next=next_path)
        next_url = '%s#token=%s' % (next_url, token)
        return redirect(next_url)

    log.error("No OAuth handler for %r was installed.", oauth.provider.name)
    raise Unauthorized(gettext("Authentication has failed."))
