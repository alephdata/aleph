from datetime import datetime
from typing import Optional, Dict, Any
import unittest

import jwt

from aleph import settings
from aleph.authz import _JtwToken, InvalidJwtToken, Authz


_SECRET_KEY_FOR_TESTS = "test_suite_secret"


def create_jwt_token(
    payload: Optional[Dict[str, Any]] = None,
    key: Optional[str] = _SECRET_KEY_FOR_TESTS,
    algorithm: str = Authz._JWT_TOKENS_ALGORITHM,
    expiration_date: Optional[datetime] = datetime.utcnow() + Authz._JWT_TOKENS_VALIDITY_DURATION,
) -> str:
    final_payload = payload.copy() if payload else {"u": 1, "r": [2, 3]}
    if expiration_date:
        final_payload["exp"] = expiration_date

    return jwt.encode(payload=final_payload, key=key, algorithm=algorithm).decode("utf-8")


class JwtTokenTestCase(unittest.TestCase):

    _PREVIOUS_SECRET_KEY = None

    @classmethod
    def setUpClass(cls):
        cls._PREVIOUS_SECRET_KEY = settings.SECRET_KEY
        # Configure the secret key for the tests
        settings.SECRET_KEY = _SECRET_KEY_FOR_TESTS

    def test_from_str(self):
        # Given a valid token
        token = create_jwt_token()

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
            payload={
                # The order here must match the order of the field in _JtwToken for this test to work
                "u": 1,
                "r": [2, 3],
                "exp": 1000000000,
                "a": False,
                "b": True,
            }
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
        token = create_jwt_token(payload={"u": "not an int", "r": [2, 3]})

        # When parsing the token, it fails
        with self.assertRaises(InvalidJwtToken):
            _JtwToken.from_str(token)

    def test_from_str_missing_expiration(self):
        # Given a token generated that's missing an expiration date
        token = create_jwt_token(expiration_date=None)

        # When parsing the token, it fails
        with self.assertRaises(InvalidJwtToken):
            _JtwToken.from_str(token)

    @classmethod
    def tearDownClass(cls):
        # Put back the original secret key
        settings.SECRET_KEY = cls._PREVIOUS_SECRET_KEY
