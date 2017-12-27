import jwt
import logging
from flask_oauthlib.client import OAuth

from aleph import signals, settings

oauth = OAuth()
log = logging.getLogger(__name__)


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


def configure_oauth(app):
    if not settings.TESTING:
        setup_providers(app)
    oauth.init_app(app)
    return oauth


@signals.handle_oauth_session.connect
def handle_google_oauth(sender, provider=None, oauth=None):
    from aleph.model import Role
    if 'googleapis.com' not in provider.base_url:
        return

    token = (oauth.get('access_token'), '')
    me = provider.get('userinfo', token=token)
    user_id = 'google:%s' % me.data.get('id')
    return Role.load_or_create(user_id, Role.USER, me.data.get('name'),
                               email=me.data.get('email'))


@signals.handle_oauth_session.connect
def handle_facebook_oauth(sender, provider=None, oauth=None):
    from aleph.model import Role
    if 'facebook.com' not in provider.base_url:
        return

    token = (oauth.get('access_token'), '')
    me = provider.get('me?fields=id,name,email', token=token)
    user_id = 'facebook:%s' % me.data.get('id')
    return Role.load_or_create(user_id, Role.USER, me.data.get('name'),
                               email=me.data.get('email'))


@signals.handle_oauth_session.connect
def handle_keycloak_oauth(sender, provider=None, oauth=None):
    from aleph.model import Role
    superuser_role = 'superuser'

    if 'secure.occrp.org' not in provider.base_url:
        return

    access_token = oauth.get('access_token')
    token_data = jwt.decode(access_token, verify=False)
    clients = token_data.get('resource_access', {})
    client = clients.get(provider.consumer_key, {})
    roles = set(client.get('roles', []))

    user_id = 'kc:%s' % token_data.get('email')
    if token_data.get('idashboard'):
        user_id = 'idashboard:user:%s' % token_data.get('idashboard')

    role = Role.load_or_create(user_id, Role.USER,
                               token_data.get('name'),
                               email=token_data.get('email'),
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

    return role
