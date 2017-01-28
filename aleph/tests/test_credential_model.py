from aleph.core import db
from aleph.model import Credential
from aleph.tests.factories.models import CredentialFactory
from aleph.tests.util import TestCase


class CredentialModelTest(TestCase):

    def setUp(self):
        super(CredentialModelTest, self).setUp()

        self.secret = 'secret'
        self.cred = CredentialFactory.create(secret=self.secret)
        self.role = self.cred.role

        db.session.flush()

    def test_attributes(self):
        self.assertIn(self.cred, self.role.credentials)
        self.assertIsNone(self.cred.used_at)
        self.assertEqual(self.cred.secret.encode('utf-8'), self.secret)
