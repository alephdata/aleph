import json

from aleph.core import db
from aleph.model import Collection, Permission, Role
from aleph.tests.util import TestCase


class SearchApiTestCase(TestCase):

    def setUp(self):
        super(SearchApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_simplest_search(self):
        # self.login(is_admin=True)
        res = self.client.get('/api/1/query?q=banana')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert '<em>banana</em>' in res.data, res.json
        assert 'Public Test Source' in res.data, res.json
        assert 'TOP SECRET' not in res.data, res.json

        self.login(is_admin=True)
        res = self.client.get('/api/1/query?q=banana')
        assert res.status_code == 200, res
        assert res.json['total'] == 2, res.json
        assert 'TOP SECRET' in res.data, res.json

    def test_facet_attribute(self):
        res = self.client.get('/api/1/query?facet=languages')
        assert res.status_code == 200, res
        lang_facet = res.json['facets']['languages']
        assert lang_facet['label'] == 'Languages', lang_facet
        assert len(lang_facet['values']) == 2
        text = json.dumps(lang_facet)
        assert '"ru"' in text, lang_facet

    def test_basic_filters(self):
        res = self.client.get('/api/1/query?filter:source_id=23')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json

        res = self.client.get('/api/1/query?filter:languages=ru')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

    def test_records_search(self):
        res = self.client.get('/api/1/query/records/1003?q=kwazulu')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

    def test_entity_filters(self):
        res = self.client.get('/api/1/query?collection=2000&limit=0')
        assert res.status_code == 200, res
        assert res.json['total'] == 3, res.json
        assert not len(res.json['entities']), res.json

        self.login(is_admin=True)
        res = self.client.get('/api/1/query?collection=2000&limit=0')
        ents = res.json['entities']
        assert len(ents) == 1, res.json
        assert ents[0]['name'] == 'BaNana', res.json
