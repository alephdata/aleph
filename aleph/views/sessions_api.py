import logging
from urlparse import urldefrag
from flask import Blueprint, redirect, request, abort
from flask_oauthlib.client import OAuthException
from werkzeug.exceptions import Unauthorized

from aleph import signals
from aleph.core import db, url_for
from aleph.authz import Authz
from aleph.oauth import oauth
from aleph.model import Role
from aleph.logic.sessions import create_token, check_token
from aleph.views.util import get_best_next_url, parse_request, jsonify
from aleph.views.serializers import LoginSchema


log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


@blueprint.before_app_request
def load_role():
    role = None
    if 'Authorization' in request.headers:
        credential = request.headers.get('Authorization')
        if ' ' in credential:
            mechanism, credential = credential.split(' ', 1)
        data = check_token(credential)
        if data is not None:
            role = Role.by_id(data.get('id'))
        else:
            role = Role.by_api_key(credential)
    elif 'api_key' in request.args:
        role = Role.by_api_key(request.args.get('api_key'))
    request.authz = Authz(role=role)


@blueprint.route('/api/2/sessions/login', methods=['POST'])
def password_login():
    """Provides email and password authentication."""
    data = parse_request(schema=LoginSchema)
    q = Role.by_email(data.get('email'))
    q = q.filter(Role.password_digest != None)  # noqa
    role = q.first()

    # Try a password authentication and an LDAP authentication if it is enabled
    if role is not None:
        if not role.check_password(data.get('password')):
            return Unauthorized("Authentication has failed.")

    if role is None:
        role = Role.authenticate_using_ldap(data.get('email'),
                                            data.get('password'))

    if role is None:
        return Unauthorized("Authentication has failed.")

    return jsonify({
        'status': 'ok',
        'token': create_token(role)
    })


@blueprint.route('/api/2/sessions/oauth/<string:provider>')
def oauth_init(provider):
    oauth_provider = oauth.remote_apps.get(provider)
    if not oauth_provider:
        abort(404)

    callback_url = url_for('.oauth_callback', provider=provider)
    state = get_best_next_url(request.args.get('next'), request.referrer)

    return oauth_provider.authorize(callback=callback_url, state=state)


@blueprint.route('/api/2/sessions/callback/<string:provider>')
def oauth_callback(provider):
    oauth_provider = oauth.remote_apps.get(provider)
    if not oauth_provider:
        abort(404)

    resp = oauth_provider.authorized_response()
    if resp is None or isinstance(resp, OAuthException):
        log.warning("Failed OAuth: %r", resp)
        return Unauthorized("Authentication has failed.")

    response = signals.handle_oauth_session.send(provider=oauth_provider,
                                                 oauth=resp)
    db.session.commit()
    for (_, role) in response:
        if role is None:
            continue
        log.info("Logged in: %r", role)
        next_url = get_best_next_url(request.args.get('state'), request.referrer)
        next_url, _ = urldefrag(next_url)
        next_url = '%s#token=%s' % (next_url, create_token(role))
        return redirect(next_url)

    log.error("No OAuth handler for %r was installed.", provider)
    return Unauthorized("Authentication has failed.")
