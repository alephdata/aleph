from pprint import pprint, pformat  # noqa

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
        assert res.json['total'] == 3, res.json
        assert len(res.json['results']) == 3, res.json
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
        assert len(facet['values']) == 11, len(facet['values'])
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

        res = self.client.get(self.url+'&filter:emails=vladimir_l@example.com',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 2, res.json

    def test_date_filters(self):
        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url+'&q=banana&filter:gte:properties.birthDate=1970-08-08',  # noqa
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 1, res.json

        res = self.client.get(self.url+'&filter:gte:properties.birthDate=1970-05-08'  # noqa
                              '&filter:lt:properties.birthDate=1971-01-01',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 2, res.json

    def test_facet_interval(self):
        _, headers = self.login(is_admin=True)
        res = self.client.get(self.url + '&q=banana&facet=properties.birthDate'
                              '&facet_interval:properties.birthDate=year'
                              '&filter:gte:properties.birthDate=1969||/y'
                              '&filter:lte:properties.birthDate=1971||/y',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 3, res.json
        facets = res.json['facets']['properties.birthDate']['intervals']
        assert facets[0]['label'].startswith('1969'), facets
        assert facets[0]['count'] == 0, facets
        assert facets[1]['count'] == 3, facets
        assert len(facets) == 3, facets
