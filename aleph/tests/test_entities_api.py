import json

from aleph.core import db
from aleph.model import Collection, Entity
from aleph.model.entity_details import EntityAddress
from aleph.index import index_entity, optimize_search
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
        self.ent.collections = [self.col]
        self.ent.update({
            'name': 'Winnie the Pooh',
            'jurisdiction_code': 'pa',
            'identifiers': [{
                'scheme': 'wikipedia',
                'identifier': 'en:Winnie-the-Pooh'
            }]
        })
        db.session.add(self.ent)
        db.session.commit()

    def test_index(self):
        index_entity(self.ent)
        optimize_search()
        res = self.client.get('/api/1/entities')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        assert len(res.json['collections']['values']) == 0, res.json
        self.login(is_admin=True)
        res = self.client.get('/api/1/entities')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert len(res.json['collections']['values']) == 1, res.json
        col0 = res.json['collections']['values'][0]
        assert col0['id'] == self.col.id, res.json
        assert col0['label'] == self.col.label, res.json
        assert len(res.json['facets']) == 0, res.json
        res = self.client.get('/api/1/entities?facet=jurisdiction_code')
        assert len(res.json['facets']) == 1, res.json
        assert 'values' in res.json['facets']['jurisdiction_code'], res.json

    def test_all(self):
        res = self.client.get('/api/1/entities/_all')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        self.login(is_admin=True)
        res = self.client.get('/api/1/entities/_all')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert res.json['results'][0]['id'] == self.ent.id, res.json

    def test_view(self):
        res = self.client.get('/api/1/entities/%s' % self.ent.id)
        assert res.status_code == 403, res
        self.login(is_admin=True)
        res = self.client.get('/api/1/entities/%s' % self.ent.id)
        assert res.status_code == 200, res
        assert 'entity/entity' in res.json['$schema'], res.json
        assert 'Winnie' in res.json['name'], res.json

    def test_lookup(self):
        args = '?scheme=wikipedia&identifier=en:Winnie-the-Pooh'
        res = self.client.get('/api/1/entities/_lookup%s' % args)
        assert res.status_code == 403, res
        self.login(is_admin=True)
        res = self.client.get('/api/1/entities/_lookup%s' % args)
        assert res.status_code == 200, res
        assert 'entity/entity' in res.json['$schema'], res.json
        assert 'Winnie' in res.json['name'], res.json
        args = args + 'xxx'
        res = self.client.get('/api/1/entities/_lookup%s' % args)
        assert res.status_code == 404, res

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
            'collections': [self.col.id],
            'summary': "In the middle of our street"
        }
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
            'collections': [self.col.id],
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

    def test_merge_nested(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/person.json#',
            'name': "Osama bin Laden",
            'collections': [self.col.id],
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
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        data['other_names'] = [
            {'name': "Usama bin Laden"},
            {'name': "Usama bin Ladin"},
        ]
        url = '/api/1/entities/%s?merge=true' % data['id']
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        assert 3 == len(res.json.get('other_names', [])), res.json

    def test_remove_nested(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/person.json#',
            'name': "Osama bin Laden",
            'collections': [self.col.id],
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
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        data['other_names'].pop()
        assert 1 == len(data['other_names']), data
        del data['residential_address']
        url = '/api/1/entities/%s' % data['id']
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        assert 1 == len(res.json.get('other_names', [])), res.json

    def test_edit_nested_object(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/person.json#',
            'name': "Osama bin Laden",
            'collections': [self.col.id],
            'residential_address': {
                'text': 'Home',
                'region': 'Netherlands',
                'country': 'nl'
            }
        }
        assert not EntityAddress.all().count(), EntityAddress.all().all()
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        addr_count = EntityAddress.all().count()
        assert addr_count, EntityAddress.all().all()
        data = res.json
        url = '/api/1/entities/%s' % data['id']
        data['residential_address']['region'] = 'Amsterdam'
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        assert res.json['residential_address']['region'] == 'Amsterdam', res.json
        assert EntityAddress.all().count() == addr_count, EntityAddress.all().all()

    def test_delete_entity(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/person.json#',
            'name': "Osama bin Laden",
            'collections': [self.col.id]
        }
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        url = '/api/1/entities/%s' % data['id']
        res = self.client.delete(url)
        assert res.status_code == 200, (res.status_code, res.json)
        res = self.client.get(url)
        assert res.status_code == 404, (res.status_code, res.json)

    def test_suggest_entity(self):
        self.login(is_admin=True)
        url = '/api/1/entities'
        data = {
            '$schema': '/entity/person.json#',
            'name': "Osama bin Laden",
            'collections': [self.col.id]
        }
        res = self.client.post(url, data=json.dumps(data),
                               content_type='application/json')
        optimize_search()
        res = self.client.get('/api/1/entities/_suggest?prefix=osa')
        assert res.status_code == 200, (res.status_code, res.json)
        data = res.json
        assert len(data['results']) == 1, data
        assert 'Laden' in data['results'][0]['name'], data
