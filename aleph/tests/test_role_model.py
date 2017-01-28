from aleph.core import db
from aleph.model import Credential
from aleph.tests.factories.models import RoleFactory, CredentialFactory
from aleph.tests.util import TestCase


class RoleModelTest(TestCase):

    def setUp(self):
        super(RoleModelTest, self).setUp()

        self.role = RoleFactory.create()
        db.session.commit()

    def test_attributes(self):
        self.assertEqual(self.role.credentials.count(), 0)

        cred = CredentialFactory(role=self.role)
        db.session.flush()

        self.assertEqual(self.role.credentials.count(), 1)
        self.assertIn(cred, self.role.credentials)

    def test_load_or_create_credentials_new_foreign_id(self):
        foreign_id = '{}:{}'.format(Credential.OAUTH, self.fake.md5())

        cred = self.role.load_or_create_credentials(foreign_id)

        self.assertIsInstance(cred, Credential)
        self.assertEqual(cred.source, Credential.OAUTH)
        self.assertEqual(cred.foreign_id, foreign_id)
        self.assertIsNotNone(cred.used_at)

    def test_load_or_create_credentials_password(self):
        foreign_id = '{}:{}'.format(Credential.PASSWORD, self.fake.md5())

        cred = self.role.load_or_create_credentials(foreign_id)

        self.assertEqual(cred.source, Credential.PASSWORD)
        self.assertEqual(
            cred.foreign_id, '{}:{}'.format(Credential.PASSWORD, self.role.id))

    def test_load_or_create_credentials_exists(self):
        foreign_id = '{}:{}'.format(Credential.OAUTH, self.fake.md5())

        cred = self.role.load_or_create_credentials(foreign_id)

        self.assertEqual(self.role.credentials.count(), 1)

        existing_cred = self.role.load_or_create_credentials(foreign_id)

        self.assertEqual(existing_cred, cred)
        self.assertEqual(self.role.credentials.count(), 1)
