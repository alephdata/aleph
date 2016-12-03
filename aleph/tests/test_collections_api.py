import json

from aleph.core import db
from aleph.model import Collection, Entity
from aleph.tests.util import TestCase


class CollectionsApiTestCase(TestCase):

    def setUp(self):
        super(CollectionsApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = Collection()
        self.col.label = 'Test Collection'
        self.col.foreign_id = 'test_coll_entities_api'
        self.col.category = 'leak'
        self.col.countries = []
        db.session.add(self.col)
        db.session.flush()
        self.ent = Entity.save({
            'schema': 'Person',
            'name': 'Winnie the Pooh',
        }, self.col)
        db.session.add(self.ent)
        db.session.commit()

    def test_index(self):
        res = self.client.get('/api/1/collections')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        self.login(is_admin=True)
        res = self.client.get('/api/1/collections')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

    def test_view(self):
        res = self.client.get('/api/1/collections/%s' % self.col.id)
        assert res.status_code == 403, res
        self.login(is_admin=True)
        res = self.client.get('/api/1/collections/%s' % self.col.id)
        assert res.status_code == 200, res
        assert 'test_coll' in res.json['foreign_id'], res.json
        assert 'Winnie' not in res.json['label'], res.json

    def test_update(self):
        self.login(is_admin=True)
        url = '/api/1/collections/%s' % self.col.id
        res = self.client.get(url)
        assert res.status_code == 200, res

        data = res.json
        data['label'] = 'Collected Collection'
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'Collected' in res.json['label'], res.json

        res = self.client.get(url)
        data['label'] = ''
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 400, res.json

        res = self.client.get(url)
        data['category'] = 'banana'
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 400, res.json

    def test_delete(self):
        self.login(is_admin=True)
        url = '/api/1/collections/%s' % self.col.id
        res = self.client.get(url)
        assert res.status_code == 200, res
        res = self.client.delete(url)
        assert res.status_code == 200, res
        res = self.client.get(url)
        assert res.status_code == 404, res
