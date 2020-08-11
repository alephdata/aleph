from datetime import datetime
from typing import Optional, Dict, Any
import unittest

import jwt
from werkzeug.datastructures import TypeConversionDict
from werkzeug.exceptions import Unauthorized

from aleph import settings
from aleph.authz import _JtwToken, InvalidJwtToken, Authz

from aleph.core import db
from aleph.tests.factories.models import RoleFactory
from aleph.tests.util import TestCase
from aleph.views.context import _authenticate_request


class _MockFlaskRequest:
    """Replicates the API of flask.Request needed for the tests in this file.
    """

    def __init__(
        self, path: str = "/path", authorization_header: Optional[str] = None, api_key_in_url: Optional[str] = None
    ) -> None:
        self.path = path
        self.headers = {}
        self.args = TypeConversionDict()

        if authorization_header:
            self.headers["Authorization"] = authorization_header

        if api_key_in_url:
            self.args["api_key"] = api_key_in_url


def create_jwt_token(
    key: Optional[str],
    payload: Optional[Dict[str, Any]] = None,
    algorithm: str = Authz._JWT_TOKENS_ALGORITHM,
    expiration_date: Optional[datetime] = datetime.utcnow() + Authz._JWT_TOKENS_VALIDITY_DURATION,
) -> str:
    final_payload = payload.copy() if payload else {"u": 1, "r": [2, 3]}
    if expiration_date:
        final_payload["exp"] = expiration_date

    return jwt.encode(payload=final_payload, key=key, algorithm=algorithm).decode("utf-8")


class AuthenticationTestCase(TestCase):
    def test_valid_jwt_token(self):
        # Given a request with a valid JWT token passed via the Authorization header
        role = RoleFactory.create()
        db.session.commit()
        token = create_jwt_token(key=settings.SECRET_KEY, payload={"u": role.id, "r": []})
        request = _MockFlaskRequest(authorization_header=f"JwtToken {token}")

        # When authenticating the request
        auth_info = _authenticate_request(request)

        # It succeeds and it gets authenticated as the corresponding role
        assert auth_info.role.id == role.id

    def test_invalid_jwt_token(self):
        # Given a request with an invalid JWT token passed via the Authorization header
        RoleFactory.create()
        db.session.commit()
        request = _MockFlaskRequest(authorization_header="JwtToken invalidtoken")

        # When authenticating the request
        auth_info = _authenticate_request(request)

        # It gets authenticated as the unauthenticated role
        assert auth_info.role is None

    def test_valid_jwt_token_with_scope(self):
        # Given a request with a valid JWT token passed via the Authorization header
        role = RoleFactory.create()
        db.session.commit()
        token = create_jwt_token(
            key=settings.SECRET_KEY,
            payload={
                "u": role.id,
                "r": [],
                # And the token is scoped to a specific path
                "s": "the_path/",
            },
        )
        request = _MockFlaskRequest(
            # And the request is for the same path
            path="the_path/",
            authorization_header=f"JwtToken {token}",
        )

        # When authenticating the request
        auth_info = _authenticate_request(request)

        # It succeeds and it gets authenticated as the corresponding role
        assert auth_info.role.id == role.id

    def test_invalid_jwt_token_because_wrong_scope(self):
        # Given a request with a valid JWT token passed via the Authorization header
        role = RoleFactory.create()
        db.session.commit()
        token = create_jwt_token(
            key=settings.SECRET_KEY,
            payload={
                "u": role.id,
                "r": [],
                # And the token is scoped to a specific path
                "s": "the_path/",
            },
        )
        request = _MockFlaskRequest(
            # But the request is for a different path
            path="different_path/",
            authorization_header=f"JwtToken {token}",
        )

        # When authenticating the request, it fails with an Unauthorized exception
        with self.assertRaises(Unauthorized):
            _authenticate_request(request)

    def test_valid_api_key_in_url(self):
        # Given a request with a valid API key passed via the URL
        role = RoleFactory.create()
        db.session.commit()
        request = _MockFlaskRequest(api_key_in_url=role.api_key)

        # When authenticating the request
        auth_info = _authenticate_request(request)

        # It succeeds and it gets authenticated as the corresponding role
        assert auth_info.role.id == role.id

    def test_valid_api_key_in_header(self):
        # Given a request with a valid API key passed via the Authorization header
        role = RoleFactory.create()
        db.session.commit()
        request = _MockFlaskRequest(authorization_header=f"ApiKey {role.api_key}")

        # When authenticating the request
        auth_info = _authenticate_request(request)

        # It succeeds and it gets authenticated as the corresponding role
        assert auth_info.role.id == role.id

    def test_invalid_api_key(self):
        # Given a request with an invalid API key
        role = RoleFactory.create()
        db.session.commit()
        request = _MockFlaskRequest(api_key_in_url="invalid value")

        # When authenticating the request
        auth_info = _authenticate_request(request)

        # It gets authenticated as the unauthenticated role
        assert auth_info.role is None


class JwtTokenTestCase(unittest.TestCase):

    _SECRET_KEY = "test_suite_secret"

    def test_from_str(self):
        # Given a valid token
        token = create_jwt_token(key=self._SECRET_KEY)

        # When parsing the token
        parsed_token = _JtwToken.from_str(token)

        # It succeeds
        assert parsed_token
        assert parsed_token.u == 1
        assert parsed_token.r == [2, 3]
        assert parsed_token.a is False
        assert parsed_token.b is False
        assert parsed_token.s is None

    def test_to_str(self):
        # Given a valid token that's already parsed
        token = create_jwt_token(
            key=self._SECRET_KEY,
            payload={
                # The order here must match the order of the field in _JtwToken for this test to work
                "u": 1,
                "r": [2, 3],
                "exp": 1000000000,
                "a": False,
                "b": True,
            },
        )
        parsed_token = _JtwToken.from_str(token)

        # When serializing it to a string, it succeeds and the right value is returned
        assert token == parsed_token.to_str()

    def test_from_str_none_algoritm(self):
        # Given a token generated with the insecure "none" algorithm
        token = create_jwt_token(key=None, algorithm="none")

        # When parsing the token, it fails
        with self.assertRaises(InvalidJwtToken):
            _JtwToken.from_str(token)

    def test_from_str_invalid_secret(self):
        # Given a token generated with the wrong secret key
        token = create_jwt_token(key="wrong key")

        # When parsing the token, it fails
        with self.assertRaises(InvalidJwtToken):
            _JtwToken.from_str(token)

    def test_from_str_invalid_type_in_token(self):
        # Given a token with a field that has an invalid type
        token = create_jwt_token(key=self._SECRET_KEY, payload={"u": "not an int", "r": [2, 3]})

        # When parsing the token, it fails
        with self.assertRaises(InvalidJwtToken):
            _JtwToken.from_str(token)

    def test_from_str_missing_expiration(self):
        # Given a token generated that's missing an expiration date
        token = create_jwt_token(key=self._SECRET_KEY, expiration_date=None)

        # When parsing the token, it fails
        with self.assertRaises(InvalidJwtToken):
            _JtwToken.from_str(token)
