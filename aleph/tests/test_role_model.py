from aleph.core import db
from aleph.model import Role
from aleph.tests.factories.models import RoleFactory
from aleph.tests.util import TestCase


class RoleModelTest(TestCase):

    def setUp(self):
        super(RoleModelTest, self).setUp()

        self.role = RoleFactory.create()
        db.session.commit()

    def test_by_email_when_blank_email(self):
        self.assertIsNone(Role.by_email(None))

    def test_by_email_does_not_match(self):
        self.assertIsNone(Role.by_email(self.fake.email()).first())

    def test_by_email_matches(self):
        self.assertEqual(Role.by_email(self.role.email).first(), self.role)

    def test_load_or_create_role_exists(self):
        self.assertEqual(
            Role.load_or_create(
                foreign_id=self.role.foreign_id,
                type=self.role.type,
                name=self.role.name,
                email=self.role.email
            ),
            self.role
        )
