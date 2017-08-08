import json

from aleph.tests.util import TestCase


class SearchApiTestCase(TestCase):

    def setUp(self):
        super(SearchApiTestCase, self).setUp()
        self.load_fixtures('docs.yaml')

    def test_simplest_search(self):
        # self.login(is_admin=True)
        res = self.client.get('/api/2/search?q=banana&facet=collection_id')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        # assert '<em>banana</em>' in res.data, res.json
        assert 'Public Collection' in res.data, res.json
        assert 'Secret Document' not in res.data, res.json

        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/search?q=banana',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 3, res.json
        assert 'Secret Document' in res.data, res.json

    def test_facet_attribute(self):
        res = self.client.get('/api/2/search?facet=languages')
        assert res.status_code == 200, res
        lang_facet = res.json['facets']['languages']
        assert len(lang_facet['values']) == 2
        text = json.dumps(lang_facet)
        assert '"ru"' in text, lang_facet

    def test_facet_schema(self):
        res = self.client.get('/api/2/search?facet=schema')
        assert res.status_code == 200, res
        facet = res.json['facets']['schema']
        assert len(facet['values']) == 2
        assert facet['values'][0]['label'] == 'Documents', facet

        res = self.client.get('/api/2/search?facet=schema&filter:schema=Company')  # noqa
        assert res.status_code == 200, res
        facet = res.json['facets']['schema']
        assert len(facet['values']) == 1
        assert facet['values'][0]['label'] == 'Companies', facet

    def test_basic_filters(self):
        res = self.client.get('/api/2/search?filter:source_id=23')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json

        res = self.client.get('/api/2/search?filter:languages=ru')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
