import json

from aleph.core import db
from aleph.model import Entity
from aleph.tests.util import TestCase


class CollectionsApiTestCase(TestCase):

    def setUp(self):
        super(CollectionsApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = self.create_collection(
            label='Test Collection',
            foreign_id='test_coll_entities_api',
            category='leak',
            countries=[]
        )
        self.ent = Entity.create({
            'schema': 'Person',
            'properties': {
                'name': 'Winnie the Pooh',
            }
        }, self.col)
        db.session.add(self.ent)
        db.session.commit()
        self.flush_index()

    def test_index(self):
        res = self.client.get('/api/2/collections')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/collections',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

    def test_view(self):
        res = self.client.get('/api/2/collections/%s' % self.col.id)
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/collections/%s' % self.col.id,
                              headers=headers)
        assert res.status_code == 200, res
        assert 'test_coll' in res.json['foreign_id'], res.json
        assert 'Winnie' not in res.json['label'], res.json

    def test_sitemap(self):
        self.update_index()
        url = '/api/2/collections/%s/sitemap.xml' % self.col.id
        res = self.client.get(url)
        assert res.status_code == 403, res
        self.grant_publish(self.col)
        res = self.client.get(url)
        assert res.status_code == 200, res
        data = res.data.decode('utf-8')
        assert self.ent.id in data, data

    def test_update_valid(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/collections/%s' % self.col.id
        res = self.client.get(url,
                              headers=headers)
        assert res.status_code == 200, res

        data = res.json
        data['label'] = 'Collected Collection'
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 200, res.json
        assert 'Collected' in res.json['label'], res.json

    def test_update_no_label(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/collections/%s' % self.col.id
        res = self.client.get(url, headers=headers)
        data = res.json
        data['label'] = ''
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

        res = self.client.get(url, headers=headers)
        data = res.json
        data['category'] = 'banana'
        res = self.client.post(url,
                               data=json.dumps(data),
                               headers=headers,
                               content_type='application/json')
        assert res.status_code == 400, res.json

    def test_delete(self):
        _, headers = self.login(is_admin=True)
        url = '/api/2/collections/%s' % self.col.id
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        res = self.client.delete(url, headers=headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=headers)
        assert res.status_code == 404, res

    def test_bulk_api(self):
        _, headers = self.login(is_admin=True)
        data = [
            {
                'id': '4345800498380953840',
                'schema': 'Person',
                'properties': {
                    'name': "Osama bin Laden",
                }
            },
            {
                'id': '7598743983789743598',
                'schema': 'Person',
                'properties': {
                    'name': "Osama bin Laden",
                }
            }
        ]
        url = '/api/2/collections/%s/_bulk' % self.col.id
        res = self.client.post(url, data=json.dumps(data))
        assert res.status_code == 403, res
        res = self.client.post(url, headers=headers, data=json.dumps(data))
        assert res.status_code == 204, res
        self.flush_index()
        query = '/api/2/entities?filter:collection_id=%s' % self.col.id
        res = self.client.get(query, headers=headers)
        assert res.json['total'] == 2, res.json
        data = [
            {
                'schema': 'Person',
                'properties': {
                    'name': "Osama bin Laden",
                }
            }
        ]
        res = self.client.post(url, headers=headers, data=json.dumps(data))
        assert res.status_code == 400, res
        res = self.client.get(query, headers=headers)
        assert res.json['total'] == 2, res.json
        data = [
            {
                'id': '7598743983789743598',
                'schema': 'Lollipop',
                'properties': {
                    'name': "Osama bin Laden",
                }
            }
        ]
        res = self.client.post(url, headers=headers, data=json.dumps(data))
        assert res.status_code == 400, res
