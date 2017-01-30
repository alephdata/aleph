from aleph.core import db
from aleph.model import Role, Credential
from aleph.tests.factories.models import RoleFactory, CredentialFactory
from aleph.tests.util import TestCase


class RoleModelTest(TestCase):

    def setUp(self):
        super(RoleModelTest, self).setUp()

        self.role = RoleFactory.create()
        db.session.commit()

    def test_attributes(self):
        self.assertEqual(self.role.credentials.count(), 0)

        cred = CredentialFactory.create(role=self.role)
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

    def test_authenticate_using_credential_when_no_credentials(self):
        self.assertIsNone(
            Role.authenticate_using_credential(
                self.fake.email(), self.fake.password()
            )
        )

    def test_authenticate_using_credential_wrong_email_wrong_pass(self):
        cred = CredentialFactory.create(role=self.role)

        self.assertIsNone(
            Role.authenticate_using_credential(
                self.fake.email(), self.fake.password()
            )
        )

    def test_authenticate_using_credential_existing_email_wrong_pass(self):
        cred = CredentialFactory.create(role=self.role)

        self.assertIsNone(
            Role.authenticate_using_credential(
                self.role.email, self.fake.password()
            )
        )

    def test_authenticate_using_credential_existing_email_and_good_pass(self):
        secret = self.fake.password()
        cred = CredentialFactory.create(
            role=self.role, source=Credential.PASSWORD)
        cred.update_secret(secret)

        self.assertIsNone(cred.used_at)
        self.assertEqual(
            self.role,
            Role.authenticate_using_credential(self.role.email, secret)
        )
        self.assertIsNotNone(cred.used_at)

    def test_authenticate_using_credential_bad_source(self):
        secret = self.fake.password()
        cred = CredentialFactory.create(
            role=self.role, source=Credential.OAUTH)
        cred.update_secret(secret)

        self.assertIsNone(
            Role.authenticate_using_credential(self.role.email, secret)
        )
