from werkzeug.exceptions import Unauthorized

from aleph.core import db, settings
from aleph.authz import Authz
from aleph.tests.util import TestCase


class AuthzTestCase(TestCase):
    def setUp(self):
        super(AuthzTestCase, self).setUp()
        self.user = self.create_user(foreign_id="normal_joe")
        self.group = self.create_group("group", self.user)
        self.admin = self.create_user(foreign_id="admin", is_admin=True)
        self.public = self.create_collection(foreign_id="public")
        self.grant_publish(self.public)
        self.private = self.create_collection(foreign_id="private")
        self.grant(self.private, self.group, True, False)
        db.session.commit()

    def test_anonymous(self):
        authz = Authz.from_role(None)
        assert authz.logged_in is False, authz
        assert authz.is_admin is False, authz.is_admin
        assert authz.id is None, authz.id
        assert authz.role is None, authz.role
        assert len(authz.roles) == 1, authz.roles

    def test_require_logged_in(self):
        authz = Authz.from_role(None)
        assert authz.can_browse_anonymous is True, authz
        settings.REQUIRE_LOGGED_IN = True
        authz = Authz.from_role(None)
        assert authz.can_browse_anonymous is False, authz
        authz = Authz.from_role(self.user)
        assert authz.can_browse_anonymous is True, authz
        settings.REQUIRE_LOGGED_IN = False
        authz = Authz.from_role(self.user)
        assert authz.can_browse_anonymous is True, authz

    def test_user(self):
        authz = Authz.from_role(self.user)
        assert authz.logged_in is True, authz
        assert authz.is_admin is False, authz.is_admin
        # assert authz.id == self.user.id, authz.id
        # assert authz.role == self.user, authz.role
        # assert len(authz.roles) == 4, (authz.roles, self.user.roles)
        assert authz.can(self.public, authz.READ) is True, authz._collections
        assert authz.can(self.public, authz.WRITE) is False, authz._collections
        assert authz.can(self.private, authz.READ) is True, authz._collections
        assert authz.can(self.private, authz.WRITE) is False, authz._collections

    def test_admin(self):
        authz = Authz.from_role(self.admin)
        assert authz.logged_in is True, authz
        assert authz.is_admin is True, authz.is_admin
        assert authz.id == self.admin.id, authz.id
        assert len(authz.roles) == 3, authz.roles

        assert authz.can(self.public, authz.READ) is True, authz._collections
        assert authz.can(self.public, authz.WRITE) is True, authz._collections
        assert authz.can(self.private, authz.READ) is True, authz._collections
        assert authz.can(self.private, authz.WRITE) is True, authz._collections

    def test_maintenance(self):
        settings.MAINTENANCE = True
        authz = Authz.from_role(self.admin)
        assert authz.logged_in is True, authz
        assert authz.is_admin is True, authz.is_admin
        assert authz.can(self.public, authz.WRITE) is False, authz._collections
        settings.MAINTENANCE = False

    def test_token(self):
        authz = Authz.from_role(self.admin)
        token = authz.to_token()
        with self.assertRaises(Unauthorized):
            Authz.from_token("banana")
        sauthz = Authz.from_token(token)
        assert sauthz.id == authz.id
