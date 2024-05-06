import datetime
import time_machine

from aleph.core import db
from aleph.model import Role
from aleph.tests.factories.models import RoleFactory
from aleph.logic.roles import create_user, create_group

from aleph.tests.util import TestCase


class RoleModelTest(TestCase):
    def setUp(self):
        super(RoleModelTest, self).setUp()

        self.role = RoleFactory.create()
        db.session.commit()

    def test_password(self):
        password = self.fake.password()

        role = RoleFactory.create()
        self.assertFalse(role.check_password(password))

        role.set_password(password)
        self.assertTrue(role.check_password(password))

        role.set_password(self.fake.password())
        self.assertFalse(role.check_password(password))

    def test_by_email_when_blank_email(self):
        self.assertIsNone(Role.by_email(None))

    def test_by_email_does_not_match(self):
        self.assertIsNone(Role.by_email(self.fake.email()))

    def test_by_email_matches(self):
        self.assertEqual(Role.by_email(self.role.email), self.role)

    def test_load_or_create_role_exists(self):
        self.assertEqual(
            Role.load_or_create(
                self.role.foreign_id,
                self.role.type,
                self.role.name,
                email=self.role.email,
            ),
            self.role,
        )

    def test_add_role(self):
        # Create a user and a group
        email = "test@example.com"
        name = "Test User"
        group_name = "Test Group"
        create_user(email, name, "letmein")
        create_group(group_name)

        # Add the user to the group
        user_role = Role.by_email(email)
        group_role = Role.by_foreign_id(f"group:{group_name}")
        assert user_role not in group_role.roles
        group_role.add_role(user_role)
        assert user_role in group_role.roles

    def test_remove_role(self):
        # Create a user and a group
        email = "test@example.com"
        name = "Test User"
        group_name = "Test Group"
        create_user(email, name, "letmein")
        create_group(group_name)

        # Add the user to the group
        user_role = Role.by_email(email)
        group_role = Role.by_foreign_id(f"group:{group_name}")
        group_role.add_role(user_role)
        assert user_role in group_role.roles

        # Remove the user from the group
        group_role.remove_role(user_role)
        assert user_role not in group_role.roles

    def test_role_by_api_key(self):
        role_ = self.create_user()
        role_.api_key = "1234567890"
        db.session.add(role_)
        db.session.commit()

        role = Role.by_api_key("1234567890")
        assert role is not None
        assert role.id == role_.id

    def test_role_by_api_key_empty(self):
        role_ = self.create_user()
        assert role_.api_key is None

        role = Role.by_api_key(None)
        assert role is None

        role = Role.by_api_key("")
        assert role is None

    def test_role_by_api_key_expired(self):
        role_ = self.create_user()
        role_.api_key = "1234567890"
        role_.api_key_expires_at = datetime.datetime(2024, 3, 31, 0, 0, 0)
        db.session.add(role_)
        db.session.commit()

        with time_machine.travel("2024-03-30T23:59:59Z"):
            print(role_.api_key_expires_at)
            role = Role.by_api_key(role_.api_key)
            assert role is not None
            assert role.id == role_.id

        with time_machine.travel("2024-03-31T00:00:00Z"):
            role = Role.by_api_key(role_.api_key)
            assert role is None

    def test_role_by_api_key_legacy_without_expiration(self):
        # Ensure that legacy API keys that were created without an expiration
        # date continue to work.
        role_ = self.create_user()
        role_.api_key = "1234567890"
        role_.api_key_expires_at = None
        db.session.add(role_)
        db.session.commit()

        role = Role.by_api_key("1234567890")
        assert role is not None
        assert role.id == role_.id
