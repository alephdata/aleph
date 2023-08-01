import time
from werkzeug.security import gen_salt
from banal import ensure_list

from aleph.core import db, cache
from aleph.oauth2.model import OAuth2Client, OAuth2AuthorizationCode, OAuth2Token

AUTH_CODE_CACHE_PREFIX = "oauth2-auth-code"
TOKEN_CACHE_PREFIX = "oauth2-token"


def create_oauth_client(name, redirect_uris):
    redirect_uris = ensure_list(redirect_uris)

    client_id = gen_salt(24)
    client_secret = gen_salt(48)
    client_id_issued_at = int(time.time())
    client = OAuth2Client(
        client_id=client_id,
        client_id_issued_at=client_id_issued_at,
        client_secret=client_secret,
    )

    client.set_client_metadata(
        {
            "client_name": name,
            "redirect_uris": redirect_uris,
            "response_types": ["code"],
            "grant_types": ["authorization_code"],
            "token_endpoint_auth_method": "client_secret_post",
        }
    )

    db.session.add(client)
    db.session.commit()

    return client


def _auth_code_key(code):
    return cache.key(AUTH_CODE_CACHE_PREFIX, code)


def save_auth_code(auth_code):
    key = _auth_code_key(auth_code.code)
    state = {
        "client_id": auth_code.client_id,
        "auth_time": auth_code.auth_time,
        "redirect_uri": auth_code.redirect_uri,
        "scope": auth_code.scope,
        "user_id": auth_code.user_id,
        "code_challenge": auth_code.code_challenge,
        "code_challenge_method": auth_code.code_challenge_method,
    }

    cache.set_complex(key, state, expires=OAuth2AuthorizationCode.EXPIRES)


def delete_auth_code(auth_code):
    cache.delete(_auth_code_key(auth_code.code))


def load_auth_code(code):
    key = _auth_code_key(code)
    state = cache.get_complex(key)

    if not state:
        return None

    return OAuth2AuthorizationCode(code=code, **state)


def _token_key(token):
    return cache.key(TOKEN_CACHE_PREFIX, token)


def save_token(token):
    key = _token_key(token.access_token)
    state = {
        "client_id": token.client_id,
        "token_type": token.token_type,
        "user_id": token.user_id,
        "scope": token.scope,
        "issued_at": token.issued_at,
        "expires_in": token.expires_in,
    }

    cache.set_complex(key, state, token.expires_in)


def load_token(access_token):
    key = cache.key(TOKEN_CACHE_PREFIX, access_token)
    state = cache.get_complex(key)

    if not state:
        return None

    return OAuth2Token(access_token, **state)
