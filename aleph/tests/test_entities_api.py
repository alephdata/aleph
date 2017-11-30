import json

from aleph.core import db
from aleph.model import Collection, Entity
from aleph.index import index_entity, flush_index
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
        self.ent = Entity.create({
            'schema': 'LegalEntity',
            'name': 'Winnie the Pooh',
            'properties': {
                'country': 'pa',
            }
        }, self.col)
        db.session.commit()
        index_entity(self.ent)

    def test_index(self):
        index_entity(self.ent)
        flush_index()
        res = self.client.get('/api/2/entities?facet=collection_id')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        assert len(res.json['facets']['collection_id']['values']) == 0, \
            res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/entities?facet=collection_id',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert len(res.json['facets']['collection_id']['values']) == 1, \
            res.json
        col0 = res.json['facets']['collection_id']['values'][0]
        assert col0['id'] == str(self.col.id), res.json
        assert col0['label'] == self.col.label, res.json
        assert len(res.json['facets']) == 1, res.json
        res = self.client.get('/api/2/entities?facet=countries',
                              headers=headers)
        assert len(res.json['facets']) == 1, res.json
        assert 'values' in res.json['facets']['countries'], res.json

    def test_all(self):
        res = self.client.get('/api/2/entities/_all')
        assert res.status_code == 200, res
        assert len(res.json['results']) == 0, res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/entities/_all',
                              headers=headers)
        assert res.status_code == 200, res
        assert len(res.json['results']) == 1, res.json
        assert res.json['results'][0] == [self.ent.id], res.json

    def test_view(self):
        res = self.client.get('/api/2/entities/%s' % self.ent.id)
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/entities/%s' % self.ent.id,
                              headers=headers)
        assert res.status_code == 200, res
        assert 'LegalEntity' in res.json['schema'], res.json
        assert 'Winnie' in res.json['name'], res.json

    def test_update(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities/%s' % self.ent.id
        res = self.client.get(url,
                              headers=headers)
        assert res.status_code == 200, res

        data = res.json
        data['name'] = 'Winne the little Shit'
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'little' in res.json['name'], res.json

        data['name'] = ''
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

    def test_create(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Asset',
            'name': "Our house",
            'collection_id': self.col.id,
            'properties': {
                'summary': "In the middle of our street"
            }
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'middle' in res.json['properties']['summary'][0], res.json

    def test_create_nested(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Osama bin Laden",
            'collection_id': self.col.id,
            'properties': {
                'alias': ["Usama bin Laden", "Osama bin Ladin"],
                'address': 'Home, Netherlands'
            }
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 2 == len(res.json['properties'].get('alias', [])), res.json

    def test_merge_nested(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Osama bin Laden",
            'collection_id': self.col.id,
            'properties': {
                'alias': ["Usama bin Laden", "Osama bin Ladin"],
                'address': 'Home, Netherlands'
            }
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        data['properties']['alias'] = ["Usama bin Laden", "Usama bin Ladin"]
        url = '/api/2/entities/%s?merge=true' % data['id']
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        assert 3 == len(res.json['properties'].get('alias', [])), res.json

    def test_remove_nested(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Osama bin Laden",
            'collection_id': self.col.id,
            'properties': {
                'alias': ["Usama bin Laden", "Osama bin Ladin"]
            }
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        data['properties']['alias'].pop()
        assert 1 == len(data['properties']['alias']), data
        url = '/api/2/entities/%s' % data['id']
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        assert 1 == len(res.json['properties'].get('alias', [])), res.json

    def test_delete_entity(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Osama bin Laden",
            'properties': {},
            'collection_id': self.col.id
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        url = '/api/2/entities/%s' % data['id']
        res = self.client.delete(url,
                                 headers=headers)
        assert res.status_code == 410, (res.status_code, res.json)
        res = self.client.get(url,
                              headers=headers)
        assert res.status_code == 404, (res.status_code, res.json)

    def test_suggest_entity(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Osama bin Laden",
            'properties': {},
            'collection_id': self.col.id
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res
        flush_index()
        res = self.client.get('/api/2/entities/_suggest?prefix=osa',
                              headers=headers)
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        assert len(data['results']) == 1, data
        assert 'Laden' in data['results'][0]['name'], data

    def test_similar_entity(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Osama bin Laden",
            'collection_id': self.col.id
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        data = {
            'schema': 'Person',
            'name': "Osama ben Ladyn",
            'collection_id': self.col.id
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        flush_index()
        res = self.client.get('/api/2/entities/%s/similar' % res.json['id'],
                              headers=headers)
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        assert len(data['results']) == 1, data
        assert 'Laden' in data['results'][0]['name'], data
        assert 'Pooh' not in res.data, res.data
