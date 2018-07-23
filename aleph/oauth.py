import jwt
import logging
from flask_oauthlib.client import OAuth

from aleph import signals, settings

oauth = OAuth()
log = logging.getLogger(__name__)


def configure_oauth(app):
    if settings.OAUTH:
        oauth.provider = oauth.remote_app(
            name=settings.OAUTH_NAME,
            consumer_key=settings.OAUTH_KEY,
            consumer_secret=settings.OAUTH_SECRET,
            request_token_params={
                'scope': settings.OAUTH_SCOPE
            },
            base_url=settings.OAUTH_BASE_URL,
            request_token_url=settings.OAUTH_REQUEST_TOKEN_URL,
            access_token_method=settings.OAUTH_TOKEN_METHOD,
            access_token_url=settings.OAUTH_TOKEN_URL,
            authorize_url=settings.OAUTH_AUTHORIZE_URL
        )
    oauth.init_app(app)
    return oauth


@signals.handle_oauth_session.connect
def handle_azure_oauth(sender, provider=None, oauth=None):
    from aleph.model import Role
    if 'login.microsoftonline.com' not in provider.base_url:
        return

    token_data = jwt.decode(oauth.get('id_token'), verify=False) # TODO: verify=True


    user_id = 'azure:%s' % token_data['upn']
    return Role.load_or_create(user_id, Role.USER, token_data['name'],
                               email=token_data['upn'])

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
