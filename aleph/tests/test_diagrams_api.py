from unittest import skip  # noqa
import json
import logging
from pprint import pprint  # noqa

from aleph.tests.util import TestCase
from aleph.views.util import validate

log = logging.getLogger(__name__)


class DiagramAPITest(TestCase):

    def setUp(self):
        super(DiagramAPITest, self).setUp()
        self.col = self.create_collection(data={'foreign_id': 'diagram1'})
        self.col2 = self.create_collection(data={'foreign_id': 'diagram2'})
        _, self.headers = self.login(is_admin=True)
        self.rolex = self.create_user(foreign_id='user_3')
        _, self.headers_x = self.login(foreign_id='user_3')
        self.fixture = self.get_fixture_path('royal-family.vis')
        with open(self.fixture, 'r') as fp:
            self.input_data = {
                'collection_id': self.col.id,
                'data': json.load(fp),
                'label': 'Royal Family',
                'summary': '...'
            }

    def test_diagram_crud(self):
        url = '/api/2/diagrams'
        res = self.client.post(url, json=self.input_data, headers=self.headers)  # noqa
        assert res.status_code == 200, res
        # pprint(res.json)
        validate(res.json, 'Diagram')
        ent_id = self.input_data['data']['layout']['entities'][0]['id']
        assert ent_id not in str(res.json), res.json
        signed_id = res.json['data']['layout']['entities'][0]['id']
        assert self.col.ns.verify(signed_id)
        assert isinstance(
            res.json['data']['layout']['entities'][2]['properties']['person'],
            list
        ), res.json['data']['layout']['entities'][2]['properties']['person']
        assert res.json['data']['layout']['entities'][2]['properties']['person'][0]['schema']  == 'Person'  # noqa
        diagram_id = res.json['id']

        url = '/api/2/diagrams'
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, 'QueryResponse')
        assert len(res.json['results']) == 1

        url = '/api/2/diagrams?filter:collection_id=%s' % self.col.id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, 'QueryResponse')
        assert len(res.json['results']) == 1
        res = self.client.get(url, headers=self.headers_x)
        assert res.status_code == 403, res
        url = '/api/2/diagrams?filter:collection_id=%s' % self.col2.id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, 'QueryResponse')
        assert len(res.json['results']) == 0

        url = '/api/2/diagrams/%s' % diagram_id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, 'Diagram')
        assert res.json['label'] == 'Royal Family'

        updated_diagram = self.get_fixture_path('royal-family-v2.vis')
        with open(updated_diagram, 'r') as fp:
            updated_data = {
                'data': json.load(fp),
                'label': 'Royal Family v2',
            }
        res = self.client.post(url, json=updated_data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, 'Diagram')
        signed_id = res.json['data']['layout']['entities'][0]['id']
        assert self.col.ns.verify(signed_id)
        assert isinstance(
            res.json['data']['layout']['entities'][3]['properties']['person'],
            list
        ), res.json['data']['layout']['entities']
        assert res.json['data']['layout']['entities'][3]['properties']['person'][0]['schema']  == 'Person'  # noqa
        assert res.json['label'] == 'Royal Family v2'
        assert res.json['summary'] == '...'
        res_str = json.dumps(res.json)
        assert 'Philip' not in res_str
        assert 'Charles' in res_str

        res = self.client.delete(url, headers=self.headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404, res

    def test_create_empty(self):
        data = {
            'label': 'hello',
            'collection_id': self.col.id,
        }
        url = '/api/2/diagrams'
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res

    def test_create_without_collection_id(self):
        data = {
            'label': 'hello',
        }
        url = '/api/2/diagrams'
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 400, res

    def test_unauthorized_create(self):
        url = '/api/2/diagrams'
        res = self.client.post(url, json=self.input_data, headers=self.headers_x)  # noqa
        assert res.status_code == 403, res
