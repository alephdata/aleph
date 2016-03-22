import json

from aleph.core import db
from aleph.tests.util import TestCase


class RolesApiTestCase(TestCase):

    def setUp(self):
        super(RolesApiTestCase, self).setUp()
        self.create_user(foreign_id='user_1')
        self.create_user(foreign_id='user_2')
        self.rolex = self.create_user(foreign_id='user_3')

    def test_index(self):
        res = self.client.get('/api/1/roles')
        assert res.status_code == 403, res
        self.login(is_admin=True)
        res = self.client.get('/api/1/roles')
        assert res.status_code == 200, res
        assert res.json['total'] >= 6, res.json

    def test_view(self):
        res = self.client.get('/api/1/roles/%s' % self.rolex)
        assert res.status_code == 404, res
        role = self.login()
        res = self.client.get('/api/1/roles/%s' % role.id)
        assert res.status_code == 200, res
        # assert res.json['total'] >= 6, res.json

    def test_update(self):
        res = self.client.post('/api/1/roles/%s' % self.rolex)
        assert res.status_code == 404, res
        role = self.login()
        url = '/api/1/roles/%s' % role.id
        res = self.client.get(url)
        assert res.status_code == 200, res
        data = res.json
        data['name'] = 'John Doe'
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, res
        assert res.json['name'] == data['name'], res.json

        data['name'] = ''
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 400, res
