import time_machine

from aleph.core import db
from aleph.settings import SETTINGS
from aleph.model import Collection
from aleph.logic.collections import update_collection
from aleph.views.base_api import _metadata_locale
from aleph.tests.util import TestCase
from aleph.tests.factories.models import RoleFactory


class SessionsApiTestCase(TestCase):
    def setUp(self):
        super(SessionsApiTestCase, self).setUp()
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
        res = self.client.get("/api/2/metadata")
        assert res.status_code == 200, res
        auth = res.json["auth"]
        assert not auth.get("oauth_uri"), auth
        assert auth["registration_uri"], res

    def test_metadata_get_without_password_login(self):
        _metadata_locale.cache_clear()
        SETTINGS.PASSWORD_LOGIN = False
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
        data = dict(email=self.role.email, password=secret)
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
