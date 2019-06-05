from pprint import pprint  # noqa

from aleph.tests.util import TestCase


class SearchApiTestCase(TestCase):

    def setUp(self):
        super(SearchApiTestCase, self).setUp()
        self.load_fixtures()
        self.url = '/api/2/entities?filter:schemata=Thing'

    def test_simplest_search(self):
        # self.login(is_admin=True)
        res = self.client.get(self.url+'&q=kwazulu&facet=collection_id')
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        # assert '<em>banana</em>' in res.data, res.json
        assert b'Public Collection' in res.data, res.json
        assert b'Secret Document' not in res.data, res.json

        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url+'&q=banana', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
        assert len(res.json['results']) == 1, res.json
        assert b'Banana' in res.data, res.json

    def test_facet_attribute(self):
        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url+'&facet=names')
        assert res.status_code == 200, res
        facet = res.json['facets']['names']
        assert len(facet['values']) == 2, facet['values']

    def test_facet_counts(self):
        res = self.client.get(self.url+'&facet=names&facet_total:names=true')  # noqa
        assert res.status_code == 200, res
        facet = res.json['facets']['names']
        assert facet['total'] == 2, facet['total']
        res = self.client.get(self.url+'&facet=banana&facet_total:banana=true')  # noqa
        assert res.status_code == 200, res
        banana_facet = res.json['facets']['banana']
        assert banana_facet['total'] == 0, banana_facet['total']

    def test_facet_schema(self):
        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url+'&facet=schema', headers=headers)
        assert res.status_code == 200, res
        facet = res.json['facets']['schema']
        assert len(facet['values']) == 8, len(facet['values'])
        keys = [val['id'] for val in facet['values']]
        assert 'PlainText' in keys, facet
        assert 'Company' in keys, facet

        res = self.client.get(self.url+'&facet=schema&filter:schema=Company',
                              headers=headers)  # noqa
        assert res.status_code == 200, res
        facet = res.json['facets']['schema']
        assert len(facet['values']) == 1, facet['values']
        assert facet['values'][0]['id'] == 'Company', facet

    def test_basic_filters(self):
        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url+'&filter:source_id=23')
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json

        res = self.client.get(self.url+'&filter:names=Vladimir+Putin',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json
