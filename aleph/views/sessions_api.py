import logging
from urllib.parse import urldefrag

from flask import Blueprint, redirect, request, abort
from flask_oauthlib.client import OAuthException
from werkzeug.exceptions import Unauthorized

from aleph import signals, settings
from aleph.core import db, url_for
from aleph.authz import Authz
from aleph.oauth import oauth
from aleph.model import Role
from aleph.logic.roles import update_role
from aleph.logic.audit import record_audit
from aleph.views.util import get_best_next_url, parse_request, jsonify
from aleph.serializers.roles import LoginSchema


log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


def _get_credential_authz(credential):
    if credential is None or not len(credential):
        return
    if ' ' in credential:
        mechanism, credential = credential.split(' ', 1)
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
    data = parse_request(LoginSchema)
    role = Role.by_email(data.get('email'))
    if role is None or not role.has_password:
        return Unauthorized("Authentication has failed.")

    if not role.check_password(data.get('password')):
        return Unauthorized("Authentication has failed.")

    update_role(role)
    db.session.commit()
    authz = Authz.from_role(role)
    request.authz = authz
    record_audit("USER.LOGIN", {})
    return jsonify({
        'status': 'ok',
        'token': authz.to_token(role=role)
    })


@blueprint.route('/api/2/sessions/oauth')
def oauth_init():
    if not settings.OAUTH:
        abort(404)

    callback_url = url_for('.oauth_callback')
    state = get_best_next_url(request.args.get('next'), request.referrer)
    return oauth.provider.authorize(callback=callback_url, state=state)


@blueprint.route('/api/2/sessions/callback')
def oauth_callback():
    if not settings.OAUTH:
        abort(404)

    resp = oauth.provider.authorized_response()
    if resp is None or isinstance(resp, OAuthException):
        log.warning("Failed OAuth: %r", resp)
        return Unauthorized("Authentication has failed.")

    response = signals.handle_oauth_session.send(provider=oauth.provider,
                                                 oauth=resp)
    for (_, role) in response:
        if role is None:
            continue
        update_role(role)
        db.session.commit()
        log.info("Logged in: %r", role)
        authz = Authz.from_role(role)
        token = authz.to_token(role=role)
        token = token.decode('utf-8')
        state = request.args.get('state')
        next_url = get_best_next_url(state, request.referrer)
        next_url, _ = urldefrag(next_url)
        next_url = '%s#token=%s' % (next_url, token)
        request.authz = authz
        record_audit("USER.LOGIN", {})
        return redirect(next_url)

    log.error("No OAuth handler for %r was installed.", oauth.provider.name)
    return Unauthorized("Authentication has failed.")
