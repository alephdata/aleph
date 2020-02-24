from unittest import skip  # noqa
import json
import logging
from pprint import pprint  # noqa

from banal import ensure_list
from followthemoney import model
from followthemoney.util import get_entity_id
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.tests.util import TestCase
from aleph.views.util import validate
from aleph.logic.entities import upsert_entity
from aleph.logic.collections import delete_collection

log = logging.getLogger(__name__)


def _normalize_data(data):
    """Turn entities in properties into entity ids"""
    entities = data['layout']['entities']
    for obj in entities:
        schema = model.get(obj.get('schema'))
        if schema is None:
            raise InvalidData("Invalid schema %s" % obj.get('schema'))
        properties = obj.get('properties', {})
        for prop in schema.properties.values():
            if prop.type == registry.entity:
                values = ensure_list(properties.get(prop.name))
                if values:
                    properties[prop.name] = []
                    for value in values:
                        entity_id = get_entity_id(value)
                        properties[prop.name].append(entity_id)
    return data


def _replace_ids(layout, signed_entity_ids):
    layout = json.dumps(layout)
    for old_id, new_id in signed_entity_ids.items():
        layout = layout.replace(old_id, new_id)
    layout = json.loads(layout)
    return layout


class DiagramAPITest(TestCase):

    def setUp(self):
        super(DiagramAPITest, self).setUp()
        self.col = self.create_collection(data={'foreign_id': 'diagram1'})
        self.col2 = self.create_collection(data={'foreign_id': 'diagram2'})
        _, self.headers = self.login(is_admin=True)
        self.rolex = self.create_user(foreign_id='user_3')
        _, self.headers_x = self.login(foreign_id='user_3')
        self.input_data = self._load_data_for_import('royal-family.vis')
        # pprint(self.input_data)

    def _load_data_for_import(self, fixture):
        fixture = self.get_fixture_path(fixture)
        with open(fixture, 'r') as fp:
            data = json.load(fp)
        layout = data.pop('layout')
        entities = layout.pop('entities')
        return {
            'collection_id': str(self.col.id),
            'layout': layout,
            'entities': entities,
            'label': 'Royal Family',
            'summary': '...'
        }

    def _load_data_for_update(self, fixture):
        fixture = self.get_fixture_path(fixture)
        with open(fixture, 'r') as fp:
            data = json.load(fp)
        data = _normalize_data(data)
        layout = data.pop('layout')
        entities = layout.pop('entities')
        # Replace entitiy ids given by VIS with our own newly created signed
        # entity ids.
        signed_entity_ids = {}
        for ent in entities:
            ent = json.dumps(ent)
            for old_id, new_id in signed_entity_ids.items():
                ent = ent.replace(old_id, new_id)
            ent = json.loads(ent)
            # clear existing id if any
            ent.pop('foreign_id', None)
            signed_entity_id = upsert_entity(ent, self.col)
            signed_entity_ids[ent['id']] = signed_entity_id

        # Do the same replacement in layout
        layout = _replace_ids(layout, signed_entity_ids)
        return {
            'collection_id': str(self.col.id),
            'layout': layout,
            'entities': list(signed_entity_ids.values()),
            'label': 'Royal Family',
            'summary': '...'
        }

    def test_diagram_crud(self):
        url = '/api/2/diagrams'
        res = self.client.post(url, json=self.input_data, headers=self.headers)  # noqa
        assert res.status_code == 200, res
        validate(res.json, 'Diagram')
        ent_id = self.input_data['entities'][0]['id']
        assert ent_id in str(res.json), res.json
        assert isinstance(
            res.json['entities'][2]['properties']['person'],
            list
        ), res.json['entities']
        assert res.json['entities'][2]['properties']['person'][0]['schema'] == 'Person'  # noqa
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
        assert res.status_code == 200, res
        assert len(res.json['results']) == 0
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

        updated_data = self._load_data_for_update('royal-family-v2.vis')
        updated_data['label'] = 'Royal Family v2'
        res = self.client.post(url, json=updated_data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, 'Diagram')
        signed_id = res.json['entities'][0]['id']
        assert self.col.ns.verify(signed_id)
        assert isinstance(
            res.json['entities'][3]['properties']['person'],
            list
        ), res.json['entities']
        assert res.json['entities'][3]['properties']['person'][0]['schema'] == 'Person'  # noqa
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
            'collection_id': str(self.col.id),
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

    def test_delete_when_collection_deleted(self):
        data = {
            'label': 'hello',
            'collection_id': str(self.col.id),
        }
        url = '/api/2/diagrams'
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        diagram_id = res.json['id']
        delete_collection(self.col)
        url = '/api/2/diagrams/%s' % diagram_id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404, res
