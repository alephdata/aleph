import os
import json
# from pprint import pprint
from followthemoney.cli.util import load_mapping_file

from aleph.core import db
from aleph.model import Entity, Mapping
from aleph.queues import get_stage, OP_REFRESH_MAPPING
from aleph.logic.mapping import refresh_mapping
from aleph.index.entities import index_entity
from aleph.tests.util import TestCase


class EntitiesApiTestCase(TestCase):

    def setUp(self):
        super(EntitiesApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = self.create_collection()
        self.data = {
            'schema': 'LegalEntity',
            'properties': {
                'name': 'Winnie the Pooh',
                'country': 'pa',
            }
        }
        self.ent = Entity.create(self.data, self.col)
        self.id = self.col.ns.sign(self.ent.id)
        db.session.commit()
        index_entity(self.ent)

    def test_index(self):
        url = '/api/2/entities?filter:schemata=Thing'
        res = self.client.get(url+'&facet=collection_id')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        assert len(res.json['facets']['collection_id']['values']) == 0, \
            res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get(url+'&facet=collection_id', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert len(res.json['facets']['collection_id']['values']) == 1, \
            res.json
        col0 = res.json['facets']['collection_id']['values'][0]
        assert col0['id'] == str(self.col.id), res.json
        assert col0['label'] == self.col.label, res.json
        assert len(res.json['facets']) == 1, res.json
        res = self.client.get(url+'&facet=countries', headers=headers)
        assert len(res.json['facets']) == 1, res.json
        assert 'values' in res.json['facets']['countries'], res.json

    def test_export(self):
        self.load_fixtures()
        url = '/api/2/search/export?filter:schemata=Thing&q=pakistan'
        res = self.client.get(url)
        assert res.status_code == 403, res

        _, headers = self.login(is_admin=True)
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert 'application/zip' in res.headers.get('Content-Type')

    def test_view(self):
        url = '/api/2/entities/%s' % self.id
        res = self.client.get(url)
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert 'LegalEntity' in res.json['schema'], res.json
        assert 'Winnie' in res.json['name'], res.json

    def test_update(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities/%s' % self.id
        res = self.client.get(url,
                              headers=headers)
        assert res.status_code == 200, res

        data = res.json
        data['properties']['name'] = ['Winne the little Shit']
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'little' in res.json['name'], res.json

        data['properties'].pop('name', None)
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

    def test_create(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'RealEstate',
            'collection_id': self.col.id,
            'properties': {
                'name': "Our house",
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
            'schema': 'RealEstate',
            'collection': {
                'id': self.col.id,
                'label': 'blaaa'
            },
            'properties': {
                'name': "Our house",
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
            'collection_id': self.col.id,
            'properties': {
                'name': "Osama bin Laden",
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
            'collection_id': self.col.id,
            'properties': {
                'name': "Osama bin Laden",
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
            'collection_id': self.col.id,
            'properties': {
                'name': "Osama bin Laden",
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
            'properties': {
                'name': "Osama bin Laden",
            },
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

    def test_similar_entity(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/entities'
        data = {
            'schema': 'Person',
            'collection_id': self.col.id,
            'properties': {
                'name': "Osama bin Laden",
            }
        }
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        data = {
            'schema': 'Person',
            'collection_id': self.col.id,
            'properties': {
                'name': "Osama bin Laden",
            }
        }
        obj = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        url = '/api/2/entities/%s/similar' % obj.json['id']
        similar = self.client.get(url, headers=headers)
        assert similar.status_code == 200, (similar.status_code, similar.json)
        text = similar.data.decode('utf-8')
        assert obj.json['id'] not in text, obj.id
        assert obj.json['id'] not in text, obj.id
        data = similar.json
        assert len(data['results']) == 1, data
        assert 'Laden' in data['results'][0]['name'], data
        assert b'Pooh' not in res.data, res.data

    def test_match(self):
        _, headers = self.login(is_admin=True)
        data = {
            'schema': 'Person',
            'collection_id': self.col.id,
            'properties': {
                'name': "Osama bin Laden",
            }
        }
        res = self.client.post('/api/2/entities',
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        data = {
            'schema': 'Person',
            'properties': {
                'name': "Osama bin Laden",
            }
        }
        matches = self.client.post('/api/2/match',
                                   data=json.dumps(data),
                                   headers=headers,
                                   content_type='application/json')
        assert matches.status_code == 200, (matches.status_code, matches.json)
        data = matches.json
        assert len(data['results']) == 1, data
        assert 'Laden' in data['results'][0]['name'], data
        assert b'Pooh' not in res.data, res.data

    def test_entity_references(self):
        db_uri = self.get_fixture_path('experts.csv').as_uri()
        os.environ['ALEPH_TEST_BULK_CSV'] = db_uri
        yml_path = self.get_fixture_path('experts.yml')
        config = load_mapping_file(yml_path)
        coll = self.create_collection()
        stage = get_stage(coll, OP_REFRESH_MAPPING)
        mapping = Mapping.create({}, 'fake-id', coll, 1)
        query = config.get('experts').get('queries')[0]
        config = {'query': query, 'mapping_id': mapping.id}
        refresh_mapping(stage, coll, config)
        _, headers = self.login(is_admin=True)

        query = '/api/2/entities?filter:schemata=Thing&q=Climate'
        res = self.client.get(query, headers=headers)
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
            'collection_id': self.col.id,
            'properties': {
                'name': "Blaaaa blubb",
                'phone': '+491769817271'
            }
        }
        resa = self.client.post(url, data=json.dumps(data),
                                headers=headers,
                                content_type='application/json')
        data = {
            'schema': 'Person',
            'collection_id': self.col.id,
            'properties': {
                'name': "Nobody Man",
                'phone': '+491769817271'
            }
        }
        resa = self.client.post(url, data=json.dumps(data),
                                headers=headers,
                                content_type='application/json')
        url = '/api/2/entities/%s/tags' % resa.json['id']
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, (res.status_code, res.json)
        results = res.json['results']
        assert len(results) == 1, results
        assert results[0]['value'] == '+491769817271', results
