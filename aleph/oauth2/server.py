import logging
import time
from authlib.oauth2.rfc6749 import AuthorizationCodeGrant
from authlib.integrations.flask_oauth2 import AuthorizationServer

from aleph.model import Role
from aleph.oauth2.model import User, OAuth2Client, OAuth2AuthorizationCode, OAuth2Token
from aleph.oauth2.logic import (
    delete_auth_code,
    save_auth_code,
    load_auth_code,
    save_token,
)

log = logging.getLogger(__name__)


class AuthorizationCodeGrant(AuthorizationCodeGrant):
    def save_authorization_code(self, code, request):
        code_challenge = request.data.get("code_challenge")
        code_challenge_method = request.data.get("code_challenge_method")

        auth_code = OAuth2AuthorizationCode(
            code=code,
            client_id=request.client.client_id,
            auth_time=int(time.time()),
            redirect_uri=request.redirect_uri,
            scope=request.scope,
            user_id=request.user.id,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
        )

        save_auth_code(auth_code)

    def query_authorization_code(self, code, client):
        auth_code = load_auth_code(code)

        if not auth_code:
            return None

        if auth_code.client_id != client.client_id:
            return None

        if auth_code.is_expired():
            return None

        return auth_code

    def delete_authorization_code(self, auth_code):
        delete_auth_code(auth_code)

    def authenticate_user(self, auth_code):
        role = Role.by_id(auth_code.user_id)
        # authlib expects a model that implements the `get_user_id` method,
        # so we wrap the `Role` model to adapt to this API
        return User(role=role)


def _save_token(token, request):
    if request.user:
        user_id = request.user.get_user_id()
    else:
        user_id = None
    client_id = request.client.client_id
    token = OAuth2Token(
        client_id=client_id,
        user_id=user_id,
        issued_at=time.time(),
        **token,
    )
    save_token(token)


def _query_client(client_id):
    return OAuth2Client.query.filter_by(client_id=client_id).first()


server = AuthorizationServer(query_client=_query_client, save_token=_save_token)


def configure_oauth2_server(app):
    server.init_app(app)
    server.register_grant(AuthorizationCodeGrant)
