import logging
from flask import session, Blueprint, redirect, request, abort
from flask_oauthlib.client import OAuthException
from apikit import jsonify, request_data
from werkzeug.exceptions import Unauthorized

from aleph import signals
from aleph.core import db, url_for, get_config
from aleph.authz import Authz, get_public_roles
from aleph.oauth import oauth
from aleph.model import Role
from aleph.events import log_event
from aleph.views.cache import enable_cache
from aleph.views.util import extract_next_url


log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


@blueprint.before_app_request
def load_role():
    request.authz = Authz(role=None)
    if session.get('user'):
        role = Role.by_id(session.get('user'))
        request.authz = Authz(role=role)
    else:
        api_key = request.args.get('api_key')
        if api_key is None:
            auth_header = request.headers.get('Authorization') or ''
            if auth_header.lower().startswith('apikey'):
                api_key = auth_header.split(' ', 1).pop()

        role = Role.by_api_key(api_key)
        if role is not None:
            request.authz = Authz(role=role)


@blueprint.route('/api/1/sessions')
def status():
    authz = request.authz
    enable_cache(vary_user=True)
    providers = sorted(oauth.remote_apps.values(), key=lambda p: p.label)
    providers = [{
        'name': p.name,
        'label': p.label,
        'login': url_for('.login', provider=p.name),
    } for p in providers]

    if get_config('PASSWORD_LOGIN'):
        providers.append({
            'name': 'password',
            'label': 'Email',
            'registration': get_config('PASSWORD_REGISTRATION'),
            'login': url_for('.password_login'),
            'register': url_for('roles_api.invite_email')
        })

    return jsonify({
        'logged_in': authz.logged_in,
        'api_key': authz.role.api_key if authz.logged_in else None,
        'role': authz.role,
        'roles': authz.roles,
        'public_roles': get_public_roles(),
        'permissions': {
            'read': authz.collections[authz.READ],
            'write': authz.collections[authz.WRITE]
        },
        'logout': url_for('.logout'),
        'providers': providers,
    })


@blueprint.route('/api/1/sessions/login/password', methods=['POST'])
def password_login():
    """Provides email and password authentication."""
    data = request_data()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        abort(404)

    log_event(request)

    role = Role.by_email(email).filter(Role.password_digest != None).first()

    # Try a password authentication and an LDAP authentication if it is enabled
    if role and role.check_password(password) is False:
        return Unauthorized("Authentication has failed.")
    elif not role:
        role = Role.authenticate_using_ldap(email, password)

    if not role:
        return Unauthorized("Authentication has failed.")

    session['user'] = role.id
    session['next_url'] = extract_next_url(request)

    return jsonify({
        'logout': url_for('.logout'),
        'api_key': role.api_key,
        'role': role
    })


@blueprint.route('/api/1/sessions/login')
@blueprint.route('/api/1/sessions/login/<string:provider>')
def login(provider=None):
    if not provider:
        # by default use the first provider if none is requested,
        # which is a useful default if there's only one
        provider = oauth.remote_apps.keys()[0]

    oauth_provider = oauth.remote_apps.get(provider)
    if not oauth_provider:
        abort(404)

    log_event(request)
    session['next_url'] = extract_next_url(request)
    callback_url = url_for('.callback', provider=provider)
    return oauth_provider.authorize(callback=callback_url)


@blueprint.route('/api/1/sessions/logout')
def logout():
    session.clear()
    return redirect('/')


@blueprint.route('/api/1/sessions/callback/<string:provider>')
def callback(provider):
    oauth_provider = oauth.remote_apps.get(provider)
    if not oauth_provider:
        abort(404)

    next_url = session.pop('next_url', '/')

    resp = oauth_provider.authorized_response()
    if resp is None or isinstance(resp, OAuthException):
        log.warning("Failed OAuth: %r", resp)
        return Unauthorized("Authentication has failed.")

    session['oauth'] = resp
    signals.handle_oauth_session.send(provider=oauth_provider, session=session)
    db.session.commit()
    if 'user' not in session:
        log.error("No OAuth handler for %r was installed.", provider)
        return Unauthorized("Authentication has failed.")
    log_event(request, role_id=session['user'])
    log.info("Logged in: %r", session['user'])
    return redirect(next_url)
