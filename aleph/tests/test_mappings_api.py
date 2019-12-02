from unittest import skip  # noqa
import json
import logging

from followthemoney import model
from followthemoney.proxy import EntityProxy

from aleph.core import archive
from aleph.index.entities import index_proxy
from aleph.tests.util import TestCase

log = logging.getLogger(__name__)


class MappingAPITest(TestCase):

    def setUp(self):
        super(MappingAPITest, self).setUp()
        self.col = self.create_collection(data={'foreign_id': 'map1'})
        _, self.headers = self.login(is_admin=True)
        self.rolex = self.create_user(foreign_id='user_3')
        _, self.headers_x = self.login(foreign_id='user_3')
        self.fixture = self.get_fixture_path('experts.csv')
        self.content_hash = archive.archive_file(self.fixture)
        data = {
            'id': 'foo',
            'schema': 'Table',
            'properties': {
                'csvHash': self.content_hash,
                'contentHash': self.content_hash,
                'mimeType': 'text/csv',
                'fileName': 'experts.csv',
                'name': 'experts.csv'
            }
        }
        self.ent = EntityProxy.from_dict(model, data)
        self.ent.id = self.col.ns.sign(self.ent.id)
        index_proxy(self.col, self.ent)
        data = {
            'id': 'foo2',
            'schema': 'Table',
            'properties': {
                'csvHash': self.content_hash,
                'contentHash': self.content_hash,
                'mimeType': 'text/csv',
                'fileName': 'experts.csv',
                'name': 'experts.csv'
            }
        }
        self.ent2 = EntityProxy.from_dict(model, data)
        self.ent2.id = self.col.ns.sign(self.ent2.id)
        index_proxy(self.col, self.ent2)
        data = {
            'id': 'bar',
            'schema': 'LegalEntity',
            'properties': {
                'name': 'John Doe'
            }
        }
        ent = EntityProxy.from_dict(model, data)
        ent.id = self.col.ns.sign(ent.id)
        index_proxy(self.col, ent)

    def test_mapping(self):
        url = '/api/2/collections/%s/mappings' % self.col.id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        res = self.client.get(url, headers=self.headers_x)
        assert res.status_code == 403, res

        url = '/api/2/collections/%s/mappings?filter:table=%s' % (self.col.id, self.ent.id)  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res

        data = {
            'table_id': self.ent.id,
            'mapping_query': {
                "person": {
                    "schema": "Person",
                    "keys": [
                        "name",
                        "nationality"
                    ],
                    "properties": {
                        "name": {
                            "column": "name"
                        },
                        "nationality": {
                            "column": "nationality"
                        },
                    }
                }
            }
        }
        res = self.client.post(url, json=data, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        mapping_id = res.json.get('id')

        url = "/api/2/entities?filter:collection_id=%s&filter:schema=LegalEntity" % self.col.id  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

        url = "/api/2/collections/%s/mappings/%s/trigger" % (self.col.id, mapping_id)  # noqa
        res = self.client.post(url, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, headers=self.headers)
        assert res.status_code == 202, res

        url = "/api/2/collections/%s/mappings/%s" % (self.col.id, mapping_id)
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json['last_run_status'] == 'success', res.json
        assert res.json['last_run_err_msg'] is None, res.json

        url = "/api/2/entities?filter:collection_id=%s&filter:schema=Person" % self.col.id  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 14, res.json
        person = res.json['results'][0]
        assert person['properties'].get('proof')[0].get('id') == self.ent.id, person['properties']  # noqa

        # test deleting loaded entities
        url = "/api/2/collections/%s/mappings/%s/flush" % (self.col.id, mapping_id)  # noqa
        res = self.client.post(url, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, headers=self.headers)
        assert res.status_code == 202, res
        url = "/api/2/entities?filter:collection_id=%s&filter:schemata=LegalEntity" % self.col.id  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        # The pre-existing legal entity should not be deleted
        assert res.json['total'] == 1, res.json

        data = {
            'table_id': self.ent2.id,
            'mapping_query': {
                "person": {
                    "schema": "Person",
                    "keys": [
                        "name",
                        "nationality"
                    ],
                    "properties": {
                        "name": {
                            "column": "name"
                        },
                        "nationality": {
                            "column": "nationality"
                        },
                        "gender": {
                            "column": "gender"
                        }
                    }
                }
            }
        }
        url = "/api/2/collections/%s/mappings/%s" % (self.col.id, mapping_id)
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert 'gender' not in json.dumps(res.json['query']), res.json
        url = "/api/2/collections/%s/mappings/%s" % (self.col.id, mapping_id)  # noqa
        res = self.client.post(url, json=data, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json.get('table_id') == self.ent2.id, res.json
        assert 'gender' in json.dumps(res.json['query'])
        url = "/api/2/entities?filter:collection_id=%s&filter:schemata=LegalEntity" % self.col.id  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

        url = "/api/2/collections/%s/mappings/%s/trigger" % (self.col.id, mapping_id)  # noqa
        res = self.client.post(url, headers=self.headers)
        url = "/api/2/entities?filter:collection_id=%s&filter:schemata=LegalEntity" % self.col.id  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.json['total'] == 15, res.json

        url = "/api/2/collections/%s/mappings/%s" % (self.col.id, mapping_id)  # noqa
        res = self.client.delete(url, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.delete(url, headers=self.headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404, res
        url = "/api/2/entities?filter:collection_id=%s&filter:schemata=LegalEntity" % self.col.id  # noqa
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 15, res.json
