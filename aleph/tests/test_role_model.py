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
