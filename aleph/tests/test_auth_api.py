from aleph.core import db
from aleph.model import Collection
from aleph.tests.util import TestCase


class AuthApiTestCase(TestCase):

    def setUp(self):
        super(AuthApiTestCase, self).setUp()

    def test_session_logged_out(self):
        res = self.client.get('/api/1/sessions')
        assert not res.json.get('logged_in'), res.json
        assert not res.json.get('role'), res.json

    def test_session_logged_in(self):
        self.login()
        res = self.client.get('/api/1/sessions')
        assert res.json.get('logged_in'), res.json
        assert res.json.get('role'), res.json

    def test_header_login(self):
        role = self.create_user()
        db.session.refresh(role)
        headers = {'Authorization': 'apikey foo'}
        res = self.client.get('/api/1/sessions', headers=headers)
        assert not res.json.get('logged_in'), res.json
        assert not res.json.get('user'), res.json

        headers = {'Authorization': 'apikey %s' % role.api_key}
        res = self.client.get('/api/1/sessions', headers=headers)
        assert res.json.get('logged_in'), res.json
        assert res.json['role']['id'] == role.id, res.json

    def test_admin_all_access(self):
        self.wl = Collection()
        self.wl.label = "Test Collection"
        self.wl.foreign_id = 'test'
        self.wl.creator = self.create_user('watcher')
        db.session.add(self.wl)
        db.session.commit()
        res = self.client.get('/api/1/sessions')
        perm = res.json['permissions']
        assert not len(perm['sources']['write']), res.json
        assert not len(perm['collections']['write']), res.json
        self.login(foreign_id='admin', is_admin=True)
        res = self.client.get('/api/1/sessions')
        perm = res.json['permissions']
        # assert not len(perm['sources']['write']), res.json
        assert len(perm['collections']['write']), res.json
