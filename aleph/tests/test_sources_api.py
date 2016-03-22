import json

from aleph.core import db
from aleph.model import Source, Permission, Role
from aleph.tests.util import TestCase


class SourcesApiTestCase(TestCase):

    def setUp(self):
        super(SourcesApiTestCase, self).setUp()
        self.source = Source()
        self.source.foreign_id = "test"
        self.source.label = "Test Collection"
        self.source.category = "news"
        db.session.add(self.source)
        db.session.flush()
        permission = Permission()
        permission.role_id = Role.system(Role.SYSTEM_USER)
        permission.read = True
        permission.write = True
        permission.resource_id = self.source.id
        permission.resource_type = Permission.SOURCE
        db.session.add(permission)
        db.session.commit()

    def test_index(self):
        res = self.client.get('/api/1/sources')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        self.login()
        res = self.client.get('/api/1/sources')
        assert res.status_code == 200, res
        assert res.json['total'] >= 1, res.json

    def test_view(self):
        res = self.client.get('/api/1/sources/%s' % self.source.id)
        assert res.status_code == 403, res
        self.login()
        res = self.client.get('/api/1/sources/%s' % self.source.id)
        assert res.status_code == 200, res.json
        data = res.json
        assert data['label'] == self.source.label

    def test_view_not_found(self):
        res = self.client.get('/api/sources/8388')
        assert res.status_code == 404, res

    def test_update(self):
        self.login()
        res = self.client.get('/api/1/sources/%s' % self.source.id)
        data = res.json
        data['label'] = '%s - new' % data['label']
        jdata = json.dumps(data)
        res = self.client.post('/api/1/sources/%s' % data['id'], data=jdata,
                               content_type='application/json')
        assert res.status_code == 200, (res.json, data)
        assert res.json['label'] == data['label'], res.json
        assert res.json['id'], res.json

    def test_update_invalid_label(self):
        self.login()
        res = self.client.get('/api/1/sources/%s' % self.source.id)
        data = res.json
        data['label'] = 'H'
        jdata = json.dumps(data)
        res = self.client.post('/api/1/sources/%s' % data['id'], data=jdata,
                               content_type='application/json')
        assert res.status_code == 400, res

    def test_update_invalid_category(self):
        self.login()
        res = self.client.get('/api/1/sources/%s' % self.source.id)
        data = res.json
        data['category'] = 'banana'
        jdata = json.dumps(data)
        res = self.client.post('/api/1/sources/%s' % data['id'], data=jdata,
                               content_type='application/json')
        assert res.status_code == 400, res
