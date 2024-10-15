import time_machine
from contextlib import contextmanager
import unittest.mock as mock
from urllib.parse import urlparse, parse_qs
from requests import Response

from aleph.core import db
from aleph.settings import SETTINGS
from aleph.model import Collection, Role
from aleph.logic.collections import update_collection
from aleph.views.base_api import _metadata_locale
from aleph.tests.util import TestCase
from aleph.tests.factories.models import RoleFactory
from aleph.oauth import oauth


class SessionsApiTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.role = RoleFactory.create()

    def test_admin_all_access(self):
        self.wl = Collection()
        self.wl.label = "Test Collection"
        self.wl.foreign_id = "test"
        self.wl.creator = self.create_user("watcher")
        db.session.add(self.wl)
        db.session.commit()
        update_collection(self.wl)
        _, headers = self.login(foreign_id="admin", is_admin=True)
        res = self.client.get("/api/2/collections/%s" % self.wl.id, headers=headers)
        assert res.status_code == 200, res

    def test_metadata_get_with_password_registration_enabled(self):
        _metadata_locale.cache_clear()
        SETTINGS.OAUTH = False
        res = self.client.get("/api/2/metadata")
        assert res.status_code == 200, res
        auth = res.json["auth"]
        assert not auth.get("oauth_uri"), auth
        assert auth["registration_uri"], res

    def test_metadata_get_without_password_login(self):
        _metadata_locale.cache_clear()
        SETTINGS.PASSWORD_LOGIN = False
        SETTINGS.OAUTH = False
        res = self.client.get("/api/2/metadata")
        assert res.status_code == 200, res
        auth = res.json["auth"]
        assert not auth.get("oauth_uri"), auth
        assert not auth.get("password_login_uri"), auth
        assert not auth.get("registration_uri"), auth

    def test_password_login_get(self):
        res = self.client.get("/api/2/sessions/login")
        assert res.status_code == 405, res

    def test_password_login_post_no_data(self):
        SETTINGS.PASSWORD_LOGIN = True
        res = self.client.post("/api/2/sessions/login")
        assert res.status_code == 400, res

    def test_password_login_post_good_email_and_password(self):
        SETTINGS.PASSWORD_LOGIN = True
        secret = self.fake.password()
        self.role.set_password(secret)
        data = {"email": self.role.email, "password": secret}
        res = self.client.post("/api/2/sessions/login", data=data)
        assert res.status_code == 200, res
        headers = {"Authorization": "Token %s" % res.json["token"]}
        res = self.client.get("/api/2/roles/%s" % self.role.id, headers=headers)
        assert res.status_code == 200, res
        assert res.json["id"] == str(self.role.id), res

    def test_password_login_last_login(self):
        SETTINGS.PASSWORD_LOGIN = True
        secret = self.fake.password()
        self.role.set_password(secret)
        assert self.role.last_login_at is None

        data = {"email": self.role.email, "password": "this is not the password"}
        res = self.client.post("/api/2/sessions/login", data=data)
        assert res.status_code == 400

        db.session.refresh(self.role)
        assert self.role.last_login_at is None

        with time_machine.travel("2024-01-01T00:00:00"):
            data = {"email": self.role.email, "password": secret}
            res = self.client.post("/api/2/sessions/login", data=data)
            assert res.status_code == 200

        db.session.refresh(self.role)
        last_login_at = self.role.last_login_at.isoformat(timespec="seconds")
        assert last_login_at == "2024-01-01T00:00:00"

    def test_password_login_incorrect_email_and_password(self):
        SETTINGS.PASSWORD_LOGIN = True
        secret = self.fake.password()
        self.role.set_password(secret)
        data = {"email": self.role.email, "password": "this is not the password"}
        res = self.client.post("/api/2/sessions/login", data=data)
        assert res.status_code == 400, res
        assert res.json["message"] == "Invalid user or password."

    def test_password_login_post_blocked_user(self):
        SETTINGS.PASSWORD_LOGIN = True
        secret = self.fake.password()
        self.role.set_password(secret)
        self.role.is_blocked = True
        db.session.add(self.role)
        db.session.commit()

        data = {"email": self.role.email, "password": "this is not the password"}
        res = self.client.post("/api/2/sessions/login", data=data)
        assert res.status_code == 400, res
        assert res.json["message"] == "Invalid user or password."

        data = {"email": self.role.email, "password": secret}
        res = self.client.post("/api/2/sessions/login", data=data)
        assert res.status_code == 403, res
        assert res.json["message"] == "Your account has been blocked."


class SessionsApiOAuthTestCase(TestCase):
    def setUp(self):
        super().setUpClass()

        SETTINGS.OAUTH = True
        SETTINGS.OAUTH_HANDLER = "test-oidc"
        SETTINGS.OAUTH_KEY = "test-client"
        SETTINGS.OAUTH_SECRET = "test-secret"

        # Depending on the value of the `OAUTH_*` settings, an OAuth provider is initialized
        # when initializing the Flask app, so we need to recreate it after setting the setting
        self.init_app()

        # Usually, this setting is discovered automatically by fetching the identity
        # provider’s metadata endpoint
        oauth.provider.authorize_url = "https://example.org/oauth/authorize"
        oauth.provider.access_token_url = "https://example.org/oauth/token"

    def test_oauth_init(self):
        res = self.client.get("/api/2/sessions/oauth")
        assert res.status_code == 302

        # After starting the OAuth flow, the user is redirected to the identity provider...
        location = urlparse(res.headers["Location"])
        assert location.netloc == "example.org"
        assert location.path == "/oauth/authorize"

        query = parse_qs(location.query)
        assert query["response_type"] == ["code"]
        assert query["client_id"] == ["test-client"]

    def test_oauth_callback(self):
        res = self.client.get("/api/2/sessions/oauth")
        location = urlparse(res.headers["Location"])
        query = parse_qs(location.query)

        state = query["state"]

        # Once the user has been authenticated, the identity provider redirects the user back and
        # includes multiple query parameters, including an authorization code. Aleph then uses
        # the auth code and sends another request to the identity provider to exchange the auth code
        # for OAuth tokens (including an ID token that contains information about the users identity).
        # In a test environment, we need to mock the request to the identity provider and the
        # validation of the returned ID token.
        with mock_oauth_token_exchange(name="John Doe", email="john.doe@example.org"):
            res = self.client.get(
                "/api/2/sessions/callback",
                query_string={
                    "code": "example-auth-code",
                    "state": state,
                },
            )

        # After a successful auth flow the users is redirected to the frontend and the users API auth token
        # is included in the URL fragment
        location = urlparse(res.headers["Location"])
        assert location.netloc == "aleph.ui"
        assert location.path == "/oauth"

        fragment_query = parse_qs(location.fragment)
        auth_token = fragment_query["token"][0]

        role_id, _ = auth_token.split(".")
        res = self.client.get(
            f"/api/2/roles/{role_id}",
            headers={"Authorization": f"Token {auth_token}"},
        )

        assert res.json["name"] == "John Doe"
        assert res.json["email"] == "john.doe@example.org"

    def test_oauth_callback_last_login(self):
        role = Role.load_or_create(
            foreign_id="test-oidc:john.doe@example.org",
            type_=Role.USER,
            name="John Doe",
        )
        assert role.last_login_at is None

        res = self.client.get("/api/2/sessions/oauth")
        location = urlparse(res.headers["Location"])
        query = parse_qs(location.query)

        state = query["state"]

        with mock_oauth_token_exchange(name="John Doe", email="john.doe@example.org"):
            with time_machine.travel("2024-01-01T00:00:00"):
                res = self.client.get(
                    "/api/2/sessions/callback",
                    query_string={
                        "code": "example-auth-code",
                        "state": state,
                    },
                )

        db.session.refresh(role)
        last_login_at = role.last_login_at.isoformat(timespec="seconds")
        assert last_login_at == "2024-01-01T00:00:00"

    def test_oauth_callback_incorrect_state(self):
        with mock_oauth_token_exchange(name="John Doe", email="john.doe@example.org"):
            res = self.client.get(
                "/api/2/sessions/callback",
                query_string={
                    "code": "example-auth-code",
                    # This is a random value usually returned from the `oauth_init` method as
                    # a query parameter in the redirect
                    "state": "random123",
                },
            )

        assert res.status_code == 401

    def test_oauth_callback_blocked_user(self):
        role = Role.load_or_create(
            foreign_id="test-oidc:john.doe@example.org",
            type_=Role.USER,
            name="John Doe",
        )
        role.is_blocked = True
        role.email = "john.doe@example.org"
        db.session.add(role)
        db.session.commit()

        res = self.client.get("/api/2/sessions/oauth")
        location = urlparse(res.headers["Location"])
        query = parse_qs(location.query)

        state = query["state"]

        with mock_oauth_token_exchange(name="John Doe", email="john.doe@example.org"):
            res = self.client.get(
                "/api/2/sessions/callback",
                query_string={
                    "code": "example-auth-code",
                    "state": state,
                },
            )

        assert res.status_code == 302

        location = urlparse(res.headers["Location"])
        assert location.netloc == "aleph.ui"
        assert location.path == "/oauth"

        query = parse_qs(location.query)
        assert query["status"] == ["error"]
        assert query["code"] == ["403"]


@contextmanager
def mock_oauth_token_exchange(name: str, email: str):
    patch_send = mock.patch("requests.sessions.Session.send")
    patch_parse = mock.patch(
        "authlib.integrations.flask_client.remote_app.FlaskRemoteApp.parse_id_token"
    )

    with patch_send as send_mock, patch_parse as parse_mock:
        send_mock.return_value = mock.Mock(
            spec=Response,
            json=lambda: {"id_token": "fake_token"},
        )

        # https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
        parse_mock.return_value = {
            "name": "John Doe",
            "email": "john.doe@example.org",
        }

        yield
