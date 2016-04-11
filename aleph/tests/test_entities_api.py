import json

from aleph.core import db
from aleph.model import Collection, Entity
from aleph.tests.util import TestCase


class EntitiesApiTestCase(TestCase):

    def setUp(self):
        super(EntitiesApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = Collection()
        self.col.label = 'Test Collection'
        self.col.foreign_id = 'test_coll_entities_api'
        db.session.add(self.col)
        db.session.flush()
        self.ent = Entity()
        self.ent.collection = self.col
        self.ent.update({
            'name': 'Winnie the Pooh',
            'category': 'Person'
        })
        db.session.add(self.ent)
        db.session.commit()

    def test_index(self):
        res = self.client.get('/api/1/entities')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        self.login(is_admin=True)
        res = self.client.get('/api/1/entities')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

    def test_view(self):
        res = self.client.get('/api/1/entities/%s' % self.ent.id)
        assert res.status_code == 403, res
        self.login(is_admin=True)
        res = self.client.get('/api/1/entities/%s' % self.ent.id)
        assert res.status_code == 200, res
        assert 'entity/entity' in res.json['$schema'], res.json
        assert 'Winnie' in res.json['name'], res.json

    def test_update(self):
        self.login(is_admin=True)
        url = '/api/1/entities/%s' % self.ent.id
        res = self.client.get(url)
        assert res.status_code == 200, res

        data = res.json
        data['name'] = 'Winne the little Shit'
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'little' in res.json['name'], res.json

        data['name'] = ''
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 400, res.json

    def test_create(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/building.json',
            'name': "Our house",
            'collection_id': self.col.id,
            'summary': "In the middle of our street"
        }
        print data
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'middle' in res.json['summary'], res.json

    def test_create_nested(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/person.json#',
            'name': "Osama bin Laden",
            'collection_id': self.col.id,
            'other_names': [
                {'name': "Usama bin Laden"},
                {'name': "Osama bin Ladin"},
            ],
            'residential_address': {
                'text': 'Home',
                'region': 'Netherlands',
                'country': 'nl'
            }
        }
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 2 == len(res.json.get('other_names', [])), res.json
