import logging
from flask import session, Blueprint, redirect, request
from flask_oauthlib.client import OAuthException
from apikit import jsonify

from aleph import authz, signals
from aleph.core import db, url_for, oauth_provider
from aleph.model import Role
from aleph.views.cache import enable_cache


log = logging.getLogger(__name__)
blueprint = Blueprint('sessions_api', __name__)


@oauth_provider.tokengetter
def get_oauth_token():
    if 'oauth' in session:
        sig = session.get('oauth')
        return (sig.get('access_token'), '')


@blueprint.before_app_request
def load_role():
    request.auth_roles = set([Role.system(Role.SYSTEM_GUEST)])
    request.auth_role = None
    request.logged_in = False

    auth_header = request.headers.get('Authorization')

    if session.get('user'):
        request.auth_roles.update(session.get('roles', []))
        request.auth_role = Role.by_id(session.get('user'))
        request.logged_in = True
    elif auth_header is not None:
        if not auth_header.lower().startswith('apikey'):
            return
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
    return jsonify({
        'logged_in': authz.logged_in(),
        'api_key': request.auth_role.api_key if authz.logged_in() else None,
        'role': request.auth_role,
        'roles': list(request.auth_roles),
        'permissions': {
            'collections': {
                'read': authz.collections(authz.READ),
                'write': authz.collections(authz.WRITE)
            },
            'sources': {
                'read': authz.sources(authz.READ),
                'write': authz.sources(authz.WRITE)
            }
        },
        'logout': url_for('.logout')
    })


@blueprint.route('/api/1/sessions/login')
def login():
    return oauth_provider.authorize(callback=url_for('.callback'))


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


@blueprint.route('/api/1/sessions/callback')
def callback():
    resp = oauth_provider.authorized_response()
    if resp is None or isinstance(resp, OAuthException):
        log.warning("Failed OAuth: %r", resp)
        # FIXME: notify the user, somehow.
        return redirect('/')

    session['oauth'] = resp
    session['roles'] = [Role.system(Role.SYSTEM_USER)]
    signals.handle_oauth_session.send(provider=oauth_provider, session=session)
    db.session.commit()
    log.info("Logged in: %r", session['user'])
    return redirect('/')
