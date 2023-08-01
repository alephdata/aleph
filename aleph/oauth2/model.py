import time
import logging
import secrets
from authlib.oauth2.rfc6749 import AuthorizationCodeMixin, TokenMixin
from authlib.integrations.sqla_oauth2 import OAuth2ClientMixin

from aleph.model import db

log = logging.getLogger(__name__)


class User:
    def __init__(self, role):
        self.role = role

    def get_user_id(self):
        return self.role.id


class OAuth2Client(db.Model, OAuth2ClientMixin):
    __tablename__ = "oauth2_client"
    id = db.Column(db.Integer, primary_key=True)


class OAuth2AuthorizationCode(AuthorizationCodeMixin):
    EXPIRES = 60

    def __init__(
        self,
        code,
        auth_time,
        client_id,
        redirect_uri,
        scope,
        user_id,
        code_challenge,
        code_challenge_method,
    ):
        self.code = code
        self.client_id = client_id
        self.auth_time = auth_time
        self.redirect_uri = redirect_uri
        self.scope = scope
        self.user_id = user_id
        self.code_challenge = code_challenge
        self.code_challenge_method = code_challenge_method

    def get_redirect_uri(self):
        return self.redirect_uri

    def get_scope(self):
        return self.scope

    def is_expired(self):
        return self.auth_time + self.EXPIRES < time.time()


class OAuth2Token(TokenMixin):
    def __init__(
        self,
        access_token,
        client_id,
        token_type,
        user_id,
        scope=None,
        issued_at=None,
        expires_in=None,
    ):
        self.access_token = access_token
        self.client_id = client_id
        self.token_type = token_type
        self.user_id = user_id
        self.scope = scope
        self.issued_at = issued_at
        self.expires_in = expires_in

    def check_client(self, client):
        return self.client_id == client.get_client_id()

    def get_scope(self):
        return self.scope

    def get_expires_in(self):
        return self.expires_in

    def is_expired(self):
        if not self.expires_in:
            return False

        expires_at = self.issued_at + self.expires_in
        return expires_at < time.time()

    def is_revoked(self):
        # Currently not implemented
        return False
