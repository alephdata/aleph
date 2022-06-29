# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT


from aleph.core import db
from aleph.model import Role
from aleph.tests.factories.models import RoleFactory

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
