import json

from aleph.core import db
from aleph.model import Collection, Entity
from aleph.index import index_entity, flush_index
from aleph.tests.util import TestCase
from aleph.logic.xref import xref_collection


class XrefApiTestCase(TestCase):

    def setUp(self):
        super(XrefApiTestCase, self).setUp()
        self.user = self.create_user()

        # First collection and entities
        self.col = Collection.create({
            'label': 'Residents of Habitat Ring',
            'foreign_id': 'test_coll_xref_api'
        }, role=self.user)
        db.session.add(self.col)
        db.session.flush()
        
        self.ent = Entity.create({
            'schema': 'Person',
            'name': 'Garak',
        }, self.col)
        db.session.add(self.ent)

        self.ent2 = Entity.create({
            'schema': 'Person',
            'name': 'Leeta',
        }, self.col)
        db.session.add(self.ent2)

        # Second collection and entities
        self.match = Collection.create({
            'label': 'Obsidian Order',
            'foreign_id': 'test_match_xref_api',
            'category': 'leak'
        }, role=self.user)
        db.session.add(self.match)
        db.session.flush()
        
        self.ent3 = Entity.create({
            'schema': 'Person',
            'name': 'Elim Garak',
        }, self.match)
        db.session.add(self.ent3)

        self.ent4 = Entity.create({
            'schema': 'Person',
            'name': 'Enabran Tain',
        }, self.match)
        db.session.add(self.ent4)

        db.session.commit()
        index_entity(self.ent)
        index_entity(self.ent2)
        index_entity(self.ent3)
        index_entity(self.ent4)
        flush_index()

        xref_collection(self.col)

    def test_summary(self):
        self.login(is_admin=True)
        colres = self.client.get('/api/2/collections/%s' % self.col.id)
        print colres.json
        res = self.client.get('/api/2/collections/%s/xref' % self.col.id)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert res.json['results'][0]['matches'] == 1, res.json
        assert 'Obsidian Order' in res.json['results'][0]['collection']['label'], res.json

    def test_matches(self):
        self.login(is_admin=True)
        res = self.client.get('/api/2/collections/%s/xref/%s' %
                              (self.col.id, self.match.id))
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert 'Garak' in res.json['results'][0]['match']['name']
        assert 'Garak' in res.json['results'][0]['entity']['name']
        assert 'Tain' not in res.json['results'][0]['match']['name']
        assert 'Leeta' not in res.json['results'][0]['entity']['name']
