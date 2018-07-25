import jwt
from urllib.request import urlopen
import base64
import json
import logging
from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.backends import default_backend
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

    # Get incoming token, extract header for use with certificate verification
    id_token = oauth.get('id_token')
    headerbit = id_token.split('.')[0]
    headerbit = base64.b64decode(headerbit).decode('utf8')
    headerbit = json.loads(headerbit)

    # Load cert from MS - can be cached for upwards of 24hrs, not done now
    cert_loc = 'https://login.microsoftonline.com/common/discovery/keys'
    cert_data= json.loads(urlopen(cert_loc).read())
    pemstart = "-----BEGIN CERTIFICATE-----\n"
    pemend = "\n-----END CERTIFICATE-----\n"
    # Find correct cert based on header
    for key in cert_data['keys']:
        if headerbit['kid'] == key['kid'] and headerbit['x5t'] == key['x5t']:
            mspubkey = key['x5c'][0]
            break
    cert_str = pemstart + mspubkey + pemend
    cert_obj = load_pem_x509_certificate(cert_str.encode('ascii'), default_backend())
    public_key = cert_obj.public_key()

    # Decode incoming token and verify against the MS cert
    token_data = jwt.decode(id_token, public_key, verify=True, audience=settings.OAUTH_KEY)

    # All Ok, move on
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
