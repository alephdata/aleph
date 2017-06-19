from aleph.tests.util import TestCase


class BaseApiTestCase(TestCase):

    def setUp(self):
        super(BaseApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get('/')
        assert res.status_code == 200, res
        assert '<title>' in res.data, res.data
        assert 'ng-view' in res.data, res.data

    def test_metadata(self):
        res = self.client.get('/api/2/metadata')
        assert res.status_code == 200, res
        assert 'countries' in res.json, res.json
        countries = res.json['countries']
        assert 'ar' in countries, countries
        assert countries['ar'] == 'Argentina', countries

    def test_statistics(self):
        res = self.client.get('/api/2/statistics')
        assert res.status_code == 200, res
        assert '$total' in res.json, res.json
        assert res.json['$total'] == 0, res.json
        self.load_fixtures('docs.yaml')
        res = self.client.get('/api/2/statistics')
        assert res.status_code == 200, res
        assert res.json['$total'] == 5, res.json
        assert res.json['$documents'] == 3, res.json
        assert res.json['$entities'] == 1, res.json
        assert res.json['$collections'] == 1, res.json
