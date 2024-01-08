import logging
from authlib.jose import JsonWebToken, JsonWebKey
from authlib.integrations.flask_client import OAuth
from authlib.jose.errors import DecodeError

from aleph.settings import SETTINGS
from aleph.util import is_auto_admin

oauth = OAuth()
log = logging.getLogger(__name__)


class OAuthError(Exception):
    pass


def configure_oauth(app, cache):
    if SETTINGS.OAUTH:
        authorize_params = {}
        if SETTINGS.OAUTH_AUDIENCE:
            authorize_params["audience"] = SETTINGS.OAUTH_AUDIENCE
        oauth.provider = oauth.register(
            name=SETTINGS.OAUTH_HANDLER,
            client_id=SETTINGS.OAUTH_KEY,
            client_secret=SETTINGS.OAUTH_SECRET,
            client_kwargs={"scope": SETTINGS.OAUTH_SCOPE},
            server_metadata_url=SETTINGS.OAUTH_METADATA_URL,
            authorize_params=authorize_params,
        )
    oauth.init_app(app, cache=cache)
    return oauth


def _parse_access_token(provider, oauth_token):
    token = oauth_token.get("access_token")
    if token is None:
        return {}

    def load_key(header, payload):
        jwk_set = JsonWebKey.import_key_set(provider.fetch_jwk_set(force=True))
        return jwk_set.find_by_kid(header.get("kid"))

    metadata = provider.load_server_metadata()
    algs = metadata.get("id_token_signing_alg_values_supported", ["RS256"])
    jwt = JsonWebToken(algs)
    claims = {"exp": {"essential": True}}
    return jwt.decode(token, key=load_key, claims_options=claims)


def _get_groups(provider, oauth_token, id_token):
    """Groups are not standardised in OIDC, so this is provider-specific."""
    try:
        access_token = _parse_access_token(provider, oauth_token)
    except DecodeError:
        # Failed to parse the access_token as JWT. Most probably, the required
        # information about groups is in the id_token.
        access_token = {}

    groups = []

    # Amazon Cognito
    groups.extend(access_token.get("cognito:groups", []))

    # Okta
    groups.extend(id_token.get("groups", []))

    # ADFS
    groups.append(id_token.get("group"))

    # RedHat KeyCloak
    clients = access_token.get("resource_access", {})
    client = clients.get(provider.client_id, {})
    groups.extend(client.get("roles", []))

    # Auth0
    groups.extend(access_token.get("permissions", []))

    # Please feel free to provider PRs for further providers.

    return set([g for g in groups if g is not None])


def handle_oauth(provider, oauth_token):
    from aleph.model import Role

    token = provider.parse_id_token(oauth_token)
    if token is None:
        raise OAuthError()
    name = token.get("name", token.get("given_name"))
    email = token.get("email", token.get("upn"))
    role_id = "%s:%s" % (SETTINGS.OAUTH_HANDLER, token.get("sub", email))
    role = Role.by_foreign_id(role_id)
    if SETTINGS.OAUTH_MIGRATE_SUB and role is None:
        role = Role.by_email(email)
        if role is not None:
            role.foreign_id = role_id
            role.update({"name": name})
    if role is None:
        role = Role.load_or_create(
            role_id, Role.USER, name, email=email, is_admin=is_auto_admin(email)
        )
    if not role.is_actor:
        raise OAuthError()
    role.clear_roles()

    for group in _get_groups(provider, oauth_token, token):
        if group == SETTINGS.OAUTH_ADMIN_GROUP:
            role.is_admin = True
            continue
        foreign_id = "group:%s" % group
        group_role = Role.load_or_create(foreign_id, Role.GROUP, group)
        role.add_role(group_role)
        log.debug("User %r is member of %r", role, group_role)
    return role
