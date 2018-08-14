from aleph.core import db
from aleph.model import Entity
from aleph.index import index_entity
from aleph.tests.util import TestCase
from aleph.logic.xref import xref_collection


class XrefApiTestCase(TestCase):

    def setUp(self):
        super(XrefApiTestCase, self).setUp()
        self.creator = self.create_user(foreign_id='creator')
        self.outsider = self.create_user(foreign_id='outsider')

        # First public collection and entities
        self.residents = self.create_collection(
            label='Residents of Habitat Ring',
            foreign_id='test_residents',
            creator=self.creator
        )
        self.grant_publish(self.residents)

        self.ent = Entity.create({
            'schema': 'Person',
            'name': 'Elim Garak',
        }, self.residents)
        db.session.add(self.ent)

        self.ent2 = Entity.create({
            'schema': 'Person',
            'name': 'Leeta',
        }, self.residents)
        db.session.add(self.ent2)

        # Second public collection and entities
        self.dabo = self.create_collection(
            label='Dabo Girls',
            foreign_id='test_dabo',
            creator=self.creator
        )
        self.grant_publish(self.dabo)

        self.ent3 = Entity.create({
            'schema': 'Person',
            'name': 'MPella',
        }, self.dabo)
        db.session.add(self.ent3)

        self.ent4 = Entity.create({
            'schema': 'Person',
            'name': 'Leeta',
        }, self.dabo)
        db.session.add(self.ent4)

        self.ent5 = Entity.create({
            'schema': 'Person',
            'name': 'Mardah',
        }, self.dabo)
        db.session.add(self.ent5)

        # Private collection and entities
        self.obsidian = self.create_collection(
            label='Obsidian Order',
            foreign_id='test_obsidian',
            creator=self.creator
        )

        self.ent6 = Entity.create({
            'schema': 'Person',
            'name': 'Elim Garack',
        }, self.obsidian)
        db.session.add(self.ent6)

        self.ent7 = Entity.create({
            'schema': 'Person',
            'name': 'Enabran Tain',
        }, self.obsidian)
        db.session.add(self.ent7)

        db.session.commit()
        index_entity(self.ent)
        index_entity(self.ent2)
        index_entity(self.ent3)
        index_entity(self.ent4)
        index_entity(self.ent5)
        index_entity(self.ent6)
        index_entity(self.ent7)
        self.flush_index()

    def test_summary(self):
        xref_collection(self.residents.id)
        res = self.client.get('/api/2/collections/%s/xref' % self.obsidian.id)
        assert res.status_code == 403, res

        # Not logged in
        resi_url = '/api/2/collections/%s/xref' % self.residents.id
        res = self.client.get(resi_url)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        coll0 = res.json['results'][0]['collection']
        assert 'Obsidian Order' not in coll0['label'], res.json
        assert 'Dabo Girls' in coll0['label'], res.json

        # Logged in as outsider (restricted access)
        _, headers = self.login(foreign_id='outsider')
        res = self.client.get(resi_url, headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        coll0 = res.json['results'][0]['collection']
        assert 'Obsidian Order' not in coll0['label'], res.json
        assert 'Dabo Girls' in coll0['label'], res.json

        # Logged in as creator (all access)
        _, headers = self.login(foreign_id='creator')
        res = self.client.get(resi_url, headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 2, res.json
        labels = [m['collection']['label'] for m in res.json['results']]
        assert 'Obsidian Order' in labels, res.json
        assert 'Dabo Girls' in labels, res.json

    def test_matches(self):
        xref_collection(self.residents.id)
        # Not logged in
        match_dabo = self.client.get('/api/2/collections/%s/xref/%s' %
                                     (self.residents.id, self.dabo.id))
        assert match_dabo.status_code == 200, match_dabo
        assert match_dabo.json['total'] == 1, match_dabo.json
        assert 'Leeta' in match_dabo.json['results'][0]['entity']['name']
        assert 'Garak' not in match_dabo.json['results'][0]['entity']['name']
        assert 'Tain' not in match_dabo.json['results'][0]['match']['name']
        assert 'MPella' not in match_dabo.json['results'][0]['match']['name']

        match_obsidian = self.client.get('/api/2/collections/%s/xref/%s' %
                                         (self.residents.id, self.obsidian.id))
        assert match_obsidian.status_code == 403, match_obsidian

        # Logged in as outsider (restricted)
        _, headers = self.login('outsider')

        match_dabo = self.client.get('/api/2/collections/%s/xref/%s' %
                                     (self.residents.id, self.dabo.id),
                                     headers=headers)
        assert match_dabo.status_code == 200, match_dabo
        assert match_dabo.json['total'] == 1, match_dabo.json
        assert 'Leeta' in match_dabo.json['results'][0]['entity']['name']
        assert 'Garak' not in match_dabo.json['results'][0]['entity']['name']
        assert 'Tain' not in match_dabo.json['results'][0]['match']['name']
        assert 'MPella' not in match_dabo.json['results'][0]['match']['name']

        match_obsidian = self.client.get('/api/2/collections/%s/xref/%s' %
                                         (self.residents.id, self.obsidian.id),
                                         headers=headers)
        assert match_obsidian.status_code == 403, match_obsidian

        # Logged in as creator (all access)
        _, headers = self.login('creator')

        match_dabo = self.client.get('/api/2/collections/%s/xref/%s' %
                                     (self.residents.id, self.dabo.id),
                                     headers=headers)
        assert match_dabo.status_code == 200, match_dabo
        assert match_dabo.json['total'] == 1, match_dabo.json
        assert 'Leeta' in match_dabo.json['results'][0]['entity']['name']
        assert 'Garak' not in match_dabo.json['results'][0]['entity']['name']
        assert 'Tain' not in match_dabo.json['results'][0]['match']['name']
        assert 'MPella' not in match_dabo.json['results'][0]['match']['name']

        match_obsidian = self.client.get('/api/2/collections/%s/xref/%s' %
                                         (self.residents.id, self.obsidian.id),
                                         headers=headers)
        assert match_obsidian.status_code == 200, match_obsidian
        assert match_obsidian.json['total'] == 1, match_obsidian.json
        assert 'Garak' in match_obsidian.json['results'][0]['entity']['name']
        assert 'Leeta' not in match_obsidian.json['results'][0]['entity']['name']  # noqa
        assert 'Tain' not in match_obsidian.json['results'][0]['match']['name']
        assert 'MPella' not in match_obsidian.json['results'][0]['match']['name']  # noqa

    def test_create_summary(self):
        res = self.client.post('/api/2/collections/%s/xref' %
                               self.residents.id)
        assert res.status_code == 403, res

        _, headers = self.login('outsider')
        res = self.client.post('/api/2/collections/%s/xref' %
                               self.residents.id, headers=headers)
        assert res.status_code == 403, res

        _, headers = self.login('creator')
        res = self.client.post('/api/2/collections/%s/xref' %
                               self.residents.id, headers=headers)
        assert res.status_code == 202, res

        url = '/api/2/collections/%s/xref' % self.residents.id
        summary = self.client.get(url, headers=headers)
        assert summary.status_code == 200, summary
        assert summary.json['total'] == 2, summary.json
        labels = [m['collection']['label'] for m in summary.json['results']]
        assert 'Obsidian Order' in labels, summary.json
        assert 'Dabo Girls' in labels, summary.json

    def test_create_matches(self):
        url = '/api/2/collections/%s/xref/%s' \
            % (self.residents.id, self.obsidian.id)
        res = self.client.post(url)
        assert res.status_code == 403, res

        _, headers = self.login('outsider')

        res = self.client.post(url, headers=headers)
        assert res.status_code == 403, res

        _, headers = self.login('creator')
        res = self.client.post(url, headers=headers)
        assert res.status_code == 202, res

        match_obsidian = self.client.get(url, headers=headers)
        assert match_obsidian.status_code == 200, match_obsidian.json
        assert match_obsidian.json['total'] == 1, match_obsidian.json
        assert 'Garak' in match_obsidian.json['results'][0]['entity']['name']
        assert 'Leeta' not in match_obsidian.json['results'][0]['entity']['name']  # noqa
        assert 'Tain' not in match_obsidian.json['results'][0]['match']['name']
        assert 'MPella' not in match_obsidian.json['results'][0]['match']['name']  # noqa
