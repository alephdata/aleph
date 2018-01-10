import logging
from urlparse import urldefrag
from flask import Blueprint, redirect, request, abort
from flask_oauthlib.client import OAuthException
from werkzeug.exceptions import Unauthorized

from aleph import signals, settings
from aleph.core import db, url_for
from aleph.authz import Authz
from aleph.oauth import oauth
from aleph.model import Role
from aleph.logic.sessions import create_token, check_token
from aleph.views.util import get_best_next_url, parse_request, jsonify
from aleph.serializers.roles import LoginSchema


log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


def _get_credential_role(credential):
    data = check_token(credential)
    if data is not None:
        return Role.by_id(data.get('id'))
    else:
        return Role.by_api_key(credential)


@blueprint.before_app_request
def load_role():
    role = None
    credential = request.headers.get('Authorization', '')
    if len(credential):
        if ' ' in credential:
            mechanism, credential = credential.split(' ', 1)
        role = _get_credential_role(credential)
    elif 'api_key' in request.args:
        role = _get_credential_role(request.args.get('api_key'))
    request.authz = Authz(role=role)


@blueprint.route('/api/2/sessions/login', methods=['POST'])
def password_login():
    """Provides email and password authentication."""
    data = parse_request(schema=LoginSchema)
    q = Role.by_email(data.get('email'))
    q = q.filter(Role.password_digest != None)  # noqa
    role = q.first()

    if role is None:
        return Unauthorized("Authentication has failed.")

    if not role.check_password(data.get('password')):
        return Unauthorized("Authentication has failed.")

    return jsonify({
        'status': 'ok',
        'token': create_token(role)
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
    db.session.commit()
    for (_, role) in response:
        if role is None:
            continue
        log.info("Logged in: %r", role)
        next_url = get_best_next_url(request.args.get('state'),
                                     request.referrer)
        next_url, _ = urldefrag(next_url)
        next_url = '%s#token=%s' % (next_url, create_token(role))
        return redirect(next_url)

    log.error("No OAuth handler for %r was installed.", oauth.provider.name)
    return Unauthorized("Authentication has failed.")
