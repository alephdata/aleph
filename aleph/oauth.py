import jwt
import logging
from flask_oauthlib.client import OAuth
from flask import session

from aleph import signals

oauth = OAuth()
log = logging.getLogger(__name__)


def get_oauth_token():
    if 'oauth' in session:
        sig = session.get('oauth')
        return (sig.get('access_token'), '')


def setup_providers(app):
    # Reset the remote apps first!
    oauth.remote_apps = {}

    providers = app.config.get('OAUTH', [])
    if isinstance(providers, dict):
        providers = [providers]

    for provider in providers:
        # OAUTH providers from the config MUST have a name entry
        name = provider.get('name')
        label = provider.pop('label', name.capitalize())

        provider = oauth.remote_app(**provider)
        provider.label = label
        provider.tokengetter(get_oauth_token)


def configure_oauth(app):
    if not app.config.get('TESTING'):
        setup_providers(app)
    oauth.init_app(app)
    return oauth


@signals.handle_oauth_session.connect
def handle_google_oauth(sender, provider=None, session=None):
    from aleph.model import Role

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
    session['user'] = role.id


@signals.handle_oauth_session.connect
def handle_facebook_oauth(sender, provider=None, session=None):
    from aleph.model import Role

    if 'facebook.com' not in provider.base_url:
        return

    me = provider.get('me?fields=id,name,email')
    user_id = 'facebook:%s' % me.data.get('id')
    role = Role.load_or_create(user_id, Role.USER, me.data.get('name'),
                               email=me.data.get('email'))
    session['user'] = role.id


@signals.handle_oauth_session.connect
def handle_keycloak_oauth(sender, provider=None, session=None):
    from aleph.model import Role
    superuser_role = 'superuser'

    if 'secure.occrp.org' not in provider.base_url:
        return

    access_token = session.get('oauth', {}).get('access_token')
    access_token = jwt.decode(access_token, verify=False)
    clients = access_token.get('resource_access', {})
    client = clients.get(provider.consumer_key, {})
    roles = set(client.get('roles', []))

    user_id = 'kc:%s' % access_token.get('email')
    if access_token.get('idashboard'):
        user_id = 'idashboard:user:%s' % access_token.get('idashboard')

    role = Role.load_or_create(user_id, Role.USER,
                               access_token.get('name'),
                               email=access_token.get('email'),
                               is_admin=superuser_role in roles)
    role.clear_roles()

    for role_name in roles:
        if role_name == superuser_role:
            continue
        group_role = Role.load_or_create('kc:%s' % role_name,
                                         Role.GROUP,
                                         role_name)
        role.add_role(group_role)
        log.debug("User %r is member of %r", role, group_role)

    session['user'] = role.id
