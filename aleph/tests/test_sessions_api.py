import jwt
from aleph.core import db
from aleph.model import Collection
from aleph.tests.util import TestCase
from aleph.tests.factories.models import RoleFactory


class SessionsApiTestCase(TestCase):

    def setUp(self):
        super(SessionsApiTestCase, self).setUp()
        self.role = RoleFactory.create()

    def test_admin_all_access(self):
        self.wl = Collection()
        self.wl.label = "Test Collection"
        self.wl.foreign_id = 'test'
        self.wl.creator = self.create_user('watcher')
        db.session.add(self.wl)
        db.session.commit()
        _, headers = self.login(foreign_id='admin', is_admin=True)
        res = self.client.get('/api/2/collections/%s' % self.wl.id,
                              headers=headers)
        assert res.status_code == 200, res

    def test_metadata_get_with_password_registration_enabled(self):
        res = self.client.get('/api/2/metadata')
        assert res.status_code == 200, res
        auth = res.json['auth']
        assert len(auth['oauth']) == 0, auth
        assert auth['password_login'], res
        assert auth['registration'], res

    def test_metadata_get_with_password_registration_disabled(self):
        self.app.config['PASSWORD_REGISTRATION'] = False
        res = self.client.get('/api/2/metadata')
        assert res.status_code == 200, res
        auth = res.json['auth']
        auth = res.json['auth']
        assert len(auth['oauth']) == 0, auth
        assert auth['password_login'], res
        assert not auth['registration'], res

    def test_metadata_get_without_password_login(self):
        self.app.config['PASSWORD_LOGIN'] = False

        res = self.client.get('/api/2/metadata')
        assert res.status_code == 200, res
        auth = res.json['auth']
        assert not auth['password_login'], auth
        assert len(auth['oauth']) == 0, auth

    def test_password_login_get(self):
        res = self.client.get('/api/2/sessions/login')
        assert res.status_code == 405, res

    def test_password_login_post_no_data(self):
        res = self.client.post('/api/2/sessions/login')
        assert res.status_code == 400, res

    def test_password_login_post_good_email_and_password(self):
        secret = self.fake.password()
        self.role.set_password(secret)
        data = dict(email=self.role.email, password=secret)

        res = self.client.post('/api/2/sessions/login', data=data)

        assert res.status_code == 200, res
        data = jwt.decode(res.json['token'], verify=False)
        assert data['role']['id'] == self.role.id, res
