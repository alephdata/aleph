import jwt
import json
import base64
import logging
from urllib.request import urlopen
from authlib.integrations.flask_client import OAuth
from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.backends import default_backend
from servicelayer.extensions import get_entry_point
from authlib import jose

from aleph import settings

oauth = OAuth()
log = logging.getLogger(__name__)


def configure_oauth(app, cache):
    if settings.OAUTH:
        oauth.provider = oauth.register(
            name=settings.OAUTH_HANDLER,
            client_id=settings.OAUTH_KEY,
            client_secret=settings.OAUTH_SECRET,
            client_kwargs={'scope': settings.OAUTH_SCOPE},
            request_token_url=settings.OAUTH_REQUEST_TOKEN_URL,
            access_token_method=settings.OAUTH_TOKEN_METHOD,
            access_token_url=settings.OAUTH_TOKEN_URL,
            api_base_url=settings.OAUTH_BASE_URL,
            authorize_url=settings.OAUTH_AUTHORIZE_URL
        )
    oauth.init_app(app, cache=cache)
    return oauth


def handle_oauth(provider, oauth_token):
    handler = get_entry_point('aleph.oauth', settings.OAUTH_HANDLER)
    if handler is not None:
        return handler(provider, oauth_token)


def handle_azure_oauth(provider, oauth_token):
    from aleph.model import Role
    # Get incoming token, extract header for use with certificate verification
    id_token = oauth_token.get('id_token')
    headerbit = id_token.split('.')[0]
    headerbit = base64.b64decode(headerbit).decode('utf8')
    headerbit = json.loads(headerbit)

    # Load cert from MS - can be cached for upwards of 24hrs, not done now
    cert_loc = 'https://login.microsoftonline.com/common/discovery/keys'
    cert_data = json.loads(urlopen(cert_loc).read())
    pemstart = "-----BEGIN CERTIFICATE-----\n"
    pemend = "\n-----END CERTIFICATE-----\n"
    # Find correct cert based on header
    for key in cert_data['keys']:
        if headerbit['kid'] == key['kid'] and headerbit['x5t'] == key['x5t']:
            mspubkey = key['x5c'][0]
            break
    cert_str = pemstart + mspubkey + pemend
    cert_obj = load_pem_x509_certificate(cert_str.encode('ascii'),
                                         default_backend())
    public_key = cert_obj.public_key()

    # Decode incoming token and verify against the MS cert
    token_data = jwt.decode(id_token, public_key, verify=True,
                            audience=settings.OAUTH_KEY)

    # All Ok, move on
    user_id = 'azure:%s' % token_data['upn']
    return Role.load_or_create(user_id, Role.USER, token_data['name'],
                               email=token_data['upn'])


def handle_google_oauth(provider, oauth_token):
    from aleph.model import Role
    data = provider.get('userinfo', token=oauth_token).json()
    user_id = 'google:%s' % data.get('id')
    return Role.load_or_create(user_id, Role.USER, data.get('name'),
                               email=data.get('email'))

def handle_cognito_oauth(provider, oauth_token):
    from aleph.model import Role
    #Pull keys from Cognito server
    keys = json.loads(urlopen(settings.OAUTH_CERT_URL).read())
    key = lambda header, payload: jose.jwk.loads(keys,kid=header.get('kid'))
    #Verify id and access token
    id_token = jose.jwt.decode(oauth_token.get('id_token'),key,claims_options={
        'exp': {
            'essential': True
        },
        'aud': {
            'essential':True,
            'value': settings.OAUTH_KEY
        }
    })
    id_token.validate()
    access_token = jose.jwt.decode(oauth_token.get('access_token'),key,claims_options={
        'exp': {
            'essential': True
        }
    })
    access_token.validate()
    #Cognito access_token uses client_id instead of aud
    if access_token.get('client_id') != settings.OAUTH_KEY:
        return False
    #Assign group and user permissions
    groups = set(access_token.get('cognito:groups',[]))
    user_id = 'cognito:{}'.format(id_token.get('sub'))
    role = Role.load_or_create(user_id, Role.USER,
                               id_token.get('given_name'),
                               email=id_token.get('email'),
                               is_admin=settings.OAUTH_ADMIN_GROUP in groups)
    role.clear_roles()
    for role_name in groups:
        group_role = Role.load_or_create('cognitogroup:%s' % role_name,
                                         Role.GROUP,
                                         role_name)
        role.add_role(group_role)
        log.debug("User %r is member of %r", role, group_role)
    return role

def handle_adfs_oauth(provdier, oauth_token):
    #Assumes allatclaims with given_name and email configured
    #Optional group grant as well for administrative purposes
    from aleph.model import Role
    #URL of public key of AD FS server
    key = urlopen(settings.OAUTH_CERT_URL).read()
    id_token = jwt.decode(
        oauth_token.get('id_token'),
        key,
        audience=settings.OAUTH_KEY,
        options={'require':['exp','aud']},
        algorithms='RS256')
    
    user_id = 'adfs:{}'.format(id_token.get('sub'))
    role = Role.load_or_create(user_id, Role.USER,
                               id_token.get('given_name'),
                               email=id_token.get('email'),
                               is_admin=settings.OAUTH_ADMIN_GROUP == id_token.get('group'))
    role.clear_roles()
    if id_token.get('group'):
        group_role = Role.load_or_create('adfs:%s' % id_token.get('group'),
                                         Role.GROUP,
                                         id_token.get('group'))
        role.add_role(group_role)
        log.debug("User %r is member of %r", role, group_role)      
    return role

def handle_keycloak_oauth(provider, oauth_token):
    from aleph.model import Role
    access_token = oauth_token.get('access_token')
    token_data = jwt.decode(access_token, verify=False)
    clients = token_data.get('resource_access', {})
    client = clients.get(provider.client_id, {})
    roles = set(client.get('roles', []))
    is_admin = settings.OAUTH_ADMIN_GROUP in roles

    user_id = 'kc:%s' % token_data.get('email')
    if token_data.get('idashboard'):
        user_id = 'idashboard:user:%s' % token_data.get('idashboard')
    role = Role.load_or_create(user_id, Role.USER,
                               token_data.get('name'),
                               email=token_data.get('email'),
                               is_admin=is_admin)
    role.clear_roles()
    for role_name in roles:
        group_role = Role.load_or_create('kc:%s' % role_name,
                                         Role.GROUP,
                                         role_name)
        role.add_role(group_role)
        log.debug("User %r is member of %r", role, group_role)
    return role
