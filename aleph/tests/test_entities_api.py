import os
import json
# from pprint import pprint
from alephclient.tasks.util import load_config_file

from aleph.core import db
from aleph.model import Entity
from aleph.logic.entities import bulk_load
from aleph.index import index_entity
from aleph.tests.util import TestCase


class EntitiesApiTestCase(TestCase):

    def setUp(self):
        super(EntitiesApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = self.create_collection()
        self.ent = Entity.create({
            'schema': 'LegalEntity',
            'name': 'Winnie the Pooh',
            'properties': {
                'country': 'pa',
            }
        }, self.col)
        db.session.commit()
        index_entity(self.ent)
        self.flush_index()

    def test_index(self):
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

    def test_create_collection_object(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Asset',
            'name': "Our house",
            'collection': {
                'id': self.col.id,
                'label': 'blaaa'
            },
            'properties': {
                'summary': "In the middle of our street"
            }
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert res.json['collection']['id'] == str(self.col.id), res.json

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
        res = self.client.delete(url, headers=headers)
        assert res.status_code == 204, res.status_code
        res = self.client.get(url, headers=headers)
        assert res.status_code == 404, res.status_code

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
        self.flush_index()
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
            'name': "Osama bin Ladyn",
            'collection_id': self.col.id
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        self.flush_index()
        res = self.client.get('/api/2/entities/%s/similar' % res.json['id'],
                              headers=headers)
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        assert len(data['results']) == 1, data
        assert 'Laden' in data['results'][0]['name'], data
        assert b'Pooh' not in res.data, res.data

    def test_entity_references(self):
        db_uri = 'file://' + self.get_fixture_path('experts.csv')
        os.environ['ALEPH_TEST_BULK_CSV'] = db_uri
        yml_path = self.get_fixture_path('experts.yml')
        config = load_config_file(yml_path)
        bulk_load(config)
        _, headers = self.login(is_admin=True)
        self.flush_index()

        res = self.client.get('/api/2/entities?q=Climate',
                              headers=headers)
        assert res.json['total'] == 1, res.json
        grp_id = res.json['results'][0]['id']

        res = self.client.get('/api/2/entities/%s/references' % grp_id,
                              headers=headers)
        results = res.json['results']
        assert len(results) == 1, results
        assert results[0]['count'] == 3, results

    def test_entity_tags(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'name': "Blaaaa blubb",
            'properties': {
                'phone': '+491769817271'
            },
            'collection_id': self.col.id
        }
        resa = self.client.post(url,
                                data=json.dumps(data),
                                headers=headers,
                                content_type='application/json')
        data = {
            'schema': 'Person',
            'name': "Nobody Man",
            'properties': {
                'phone': '+491769817271'
            },
            'collection_id': self.col.id
        }
        resa = self.client.post(url,
                                data=json.dumps(data),
                                headers=headers,
                                content_type='application/json')
        self.flush_index()
        url = '/api/2/entities/%s/tags' % resa.json['id']
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, (res.status_code, res.json)
        results = res.json['results']
        assert len(results) == 1, results
        assert results[0]['value'] == '+491769817271', results
