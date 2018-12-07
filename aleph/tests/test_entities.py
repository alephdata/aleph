# coding: utf-8
from pprint import pprint  # noqa

from aleph.core import db
from aleph.model import Collection, Entity
from aleph.index.entities import index_entity
from aleph.tests.util import TestCase


class EntitiesTestCase(TestCase):

    def setUp(self):
        super(EntitiesTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user_3')
        self.col = Collection()
        self.col.label = 'Original Collection'
        self.col.foreign_id = 'test_coll_entities'
        db.session.add(self.col)
        self.col_other = Collection()
        self.col_other.label = 'Other Collection'
        self.col_other.foreign_id = 'test_coll_entities_other'
        db.session.add(self.col_other)
        db.session.flush()
        self.ent = Entity.create({
            'schema': 'LegalEntity',
            'properties': {
                'name': 'Winnie the Pooh',
                'country': 'pa',
                'summary': 'a fictional teddy bear created by A. A. Milne',
                'alias': ['Puh der Bär', 'Pooh Bear']
            }
        }, self.col)
        self.other = Entity.create({
            'schema': 'LegalEntity',
            'properties': {
                'name': 'Pu der Bär',
                'country': 'de',
                'description': 'he is a bear',
                'alias': ['Puh der Bär']
            }
        }, self.col)
        db.session.commit()

    def test_merge(self):
        self.ent.merge(self.other)
        db.session.flush()
        data = dict(self.ent.data)
        assert 'bear' in data['description'][0], data
        assert 'pa' in data['country'], data
        assert self.other.deleted_at is not None, self.other

    def test_api_merge(self):
        index_entity(self.ent)
        index_entity(self.other)
        self.flush_index()
        url = '/api/2/entities/%s/merge/%s' % (self.ent.id, self.other.id)
        res = self.client.delete(url, content_type='application/json')
        assert res.status_code == 403, res.status_code
        _, headers = self.login(is_admin=True)
        res = self.client.delete(url, headers=headers,
                                 content_type='application/json')
        data = res.json['properties']
        assert 'bear' in data['description'][0], data
        assert 'pa' in data['country'], data
