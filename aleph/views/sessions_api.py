import logging
from flask import session, Blueprint, redirect, request, abort
from flask_oauthlib.client import OAuthException
from apikit import jsonify

from aleph import authz, signals
from aleph.core import db, url_for
from aleph.oauth import oauth
from aleph.model import Role
from aleph.events import log_event
from aleph.views.cache import enable_cache


log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


@blueprint.before_app_request
def load_role():
    request.auth_roles = set([Role.system(Role.SYSTEM_GUEST)])
    request.auth_role = None
    request.logged_in = False

    if session.get('user'):
        request.auth_roles.update(session.get('roles', []))
        request.auth_role = Role.by_id(session.get('user'))
        request.logged_in = True
    else:
        api_key = request.args.get('api_key')
        if api_key is None:
            auth_header = request.headers.get('Authorization') or ''
            if auth_header.lower().startswith('apikey'):
                api_key = auth_header.split(' ', 1).pop()
        role = Role.by_api_key(api_key)
        if role is None:
            return
        request.auth_role = role
        request.auth_roles.update([Role.system(Role.SYSTEM_USER), role.id])
        request.logged_in = True


@blueprint.route('/api/1/sessions')
def status():
    enable_cache(vary_user=True)

    providers = sorted(oauth.remote_apps.values(), key=lambda p: p.label)
    providers = [{
        'name': p.name,
        'label': p.label,
        'login': url_for('sessions_api.login', provider=p.name),
    } for p in providers]

    return jsonify({
        'logged_in': authz.logged_in(),
        'api_key': request.auth_role.api_key if authz.logged_in() else None,
        'role': request.auth_role,
        'roles': list(request.auth_roles),
        'public_roles': authz.get_public_roles(),
        'permissions': {
            'read': authz.collections(authz.READ),
            'write': authz.collections(authz.WRITE)
        },
        'logout': url_for('.logout'),
        'providers': providers,
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
    return oauth_provider.authorize(callback=url_for('.callback', provider=provider))


@blueprint.route('/api/1/sessions/logout')
def logout():
    session.clear()
    return redirect('/')


@signals.handle_oauth_session.connect
def handle_google_oauth(sender, provider=None, session=None):
    # If you wish to use another OAuth provider with your installation of
    # aleph, you can create a Python extension package and include a
    # custom oauth handler like this, which will create roles and state
    # for your session.
    if 'googleapis.com' not in provider.base_url:
        return
    me = provider.get('userinfo')
    user_id = 'google:%s' % me.data.get('id')
    role = Role.load_or_create(user_id, Role.USER, me.data.get('name'),
                               email=me.data.get('email'))
    session['roles'].append(role.id)
    session['user'] = role.id


@signals.handle_oauth_session.connect
def handle_facebook_oauth(sender, provider=None, session=None):
    if 'facebook.com' not in provider.base_url:
        return
    me = provider.get('me?fields=id,name,email')
    user_id = 'facebook:%s' % me.data.get('id')
    role = Role.load_or_create(user_id, Role.USER, me.data.get('name'),
                               email=me.data.get('email'))
    session['roles'].append(role.id)
    session['user'] = role.id


@blueprint.route('/api/1/sessions/callback/<string:provider>')
def callback(provider):
    oauth_provider = oauth.remote_apps.get(provider)
    if not oauth_provider:
        abort(404)

    resp = oauth_provider.authorized_response()
    if resp is None or isinstance(resp, OAuthException):
        log.warning("Failed OAuth: %r", resp)
        # FIXME: notify the user, somehow.
        return redirect('/')

    session['oauth'] = resp
    session['roles'] = [Role.system(Role.SYSTEM_USER)]
    signals.handle_oauth_session.send(provider=oauth_provider, session=session)
    db.session.commit()
    log_event(request, role_id=session['user'])
    log.info("Logged in: %r", session['user'])
    return redirect('/')
