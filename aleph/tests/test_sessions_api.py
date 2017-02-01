from aleph.model import Credential
from aleph.tests.util import TestCase
from aleph.tests.factories.models import CredentialFactory


class SessionsApiTestCase(TestCase):

    def setUp(self):
        super(SessionsApiTestCase, self).setUp()

        self.credential = CredentialFactory.create(source=Credential.PASSWORD)
        self.role = self.credential.role

    def test_password_login_get(self):
        res = self.client.get('/api/1/sessions/login/password')
        assert res.status_code == 404, res

    def test_password_login_post_no_data(self):
        res = self.client.post('/api/1/sessions/login/password')
        assert res.status_code == 404, res

    def test_password_login_post_good_email_and_password(self):
        secret = self.fake.password()
        self.credential.update_secret(secret)
        data = dict(email=self.role.email, password=secret)

        res = self.client.post('/api/1/sessions/login/password', data=data)

        assert res.status_code == 200, res
        assert res.json['role']['id'] == self.role.id, res
        assert res.json['api_key'] == self.role.api_key, res
