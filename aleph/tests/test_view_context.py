from aleph.core import db
from aleph.tests.util import TestCase


class ViewContextTest(TestCase):
    def setUp(self):
        super().setUp()
        self.role = self.create_user(email="john.doe@example.org")
        self.role.set_password("12345678")
        self.role.api_key = "1234567890"

        self.other_role = self.create_user(
            foreign_id="other",
            email="jane.doe@example.org",
        )
        assert self.other_role.api_key is None

        db.session.add(self.role)
        db.session.add(self.other_role)
        db.session.commit()

    def test_authz_header_session_token(self):
        data = {
            "email": "john.doe@example.org",
            "password": "12345678",
        }
        res = self.client.post("/api/2/sessions/login", data=data)
        assert res.status_code == 200
        token = res.json["token"]

        headers = {"Authorization": f"Token {token}"}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 200
        assert res.json["email"] == "john.doe@example.org"

    def test_authz_header_session_token_invalid(self):
        headers = {"Authorization": "Token INVALID"}
        res = self.client.get("/api/2/metadata", headers=headers)
        assert res.status_code == 401

        headers = {"Authorization": "Token INVALID"}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 401

        headers = {"Authorization": "Token "}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 401

    def test_authz_header_api_key(self):
        headers = {"Authorization": f"ApiKey {self.role.api_key}"}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 200
        assert res.json["email"] == "john.doe@example.org"

        headers = {"Authorization": self.role.api_key}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 200
        assert res.json["email"] == "john.doe@example.org"

    def test_authz_header_api_key_invalid(self):
        # The API behavior is a little weird in this case. When passing an invalid API key we do
        # not immediately raise an auth error. Instead, we treat the request as an unauthenticated/
        # anonymous request. Only when trying to access a protected resource, we raise a 403 error.
        # Keeping this behavior for backwards compatibility.
        headers = {"Authorization": "ApiKey INVALID"}
        res = self.client.get("/api/2/metadata", headers=headers)
        assert res.status_code == 200

        headers = {"Authorization": "ApiKey INVALID"}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 403

        headers = {"Authorization": "ApiKey "}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 403

        headers = {"Authorization": ""}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 403

        headers = {"Authorization": "INVALID"}
        res = self.client.get(f"/api/2/roles/{self.role.id}", headers=headers)
        assert res.status_code == 403

    def test_authz_url_param_api_key(self):
        query_string = {"api_key": self.role.api_key}
        res = self.client.get(f"/api/2/roles/{self.role.id}", query_string=query_string)
        assert res.status_code == 200
        assert res.json["email"] == "john.doe@example.org"

    def test_authz_url_params_api_key_invalid(self):
        query_string = {"api_key": "INVALID"}
        res = self.client.get(f"/api/2/roles/{self.role.id}", query_string=query_string)
        assert res.status_code == 403

        query_string = {"api_key": ""}
        res = self.client.get(f"/api/2/roles/{self.role.id}", query_string=query_string)
        assert res.status_code == 403
