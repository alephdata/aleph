import json
from pprint import pprint  # noqa

from aleph.tests.util import TestCase


class SearchApiTestCase(TestCase):

    def setUp(self):
        super(SearchApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')
        self.url = '/api/2/entities?filter:schemata=Thing'

    def test_simplest_search(self):
        # self.login(is_admin=True)
        res = self.client.get(self.url+'&q=banana&facet=collection_id')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        # assert '<em>banana</em>' in res.data, res.json
        assert b'Public Collection' in res.data, res.json
        assert b'Secret Document' not in res.data, res.json

        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url+'&q=banana', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 3, res.json
        assert len(res.json['results']) == 3, res.json
        assert b'Secret Document' in res.data, res.json

    def test_facet_attribute(self):
        res = self.client.get(self.url+'&facet=languages')
        assert res.status_code == 200, res
        lang_facet = res.json['facets']['languages']
        assert len(lang_facet['values']) == 2
        text = json.dumps(lang_facet)
        assert '"ru"' in text, lang_facet

    def test_facet_counts(self):
        res = self.client.get(self.url+'&facet=languages&facet_total:languages=true')  # noqa
        assert res.status_code == 200, res
        lang_facet = res.json['facets']['languages']
        assert lang_facet['total'] == 2
        res = self.client.get(self.url+'&facet=banana&facet_total:banana=true')  # noqa
        assert res.status_code == 200, res
        banana_facet = res.json['facets']['banana']
        assert banana_facet['total'] == 0

    def test_facet_schema(self):
        res = self.client.get(self.url+'&facet=schema')
        assert res.status_code == 200, res
        facet = res.json['facets']['schema']
        assert len(facet['values']) == 4, facet
        keys = [val['id'] for val in facet['values']]
        assert 'PlainText' in keys, facet
        assert 'Company' in keys, facet

        res = self.client.get(self.url+'&facet=schema&filter:schema=Company')  # noqa
        assert res.status_code == 200, res
        facet = res.json['facets']['schema']
        assert len(facet['values']) == 1, facet['values']
        assert facet['values'][0]['id'] == 'Company', facet

    def test_basic_filters(self):
        res = self.client.get(self.url+'&filter:source_id=23')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json

        res = self.client.get(self.url+'&filter:languages=ru')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
