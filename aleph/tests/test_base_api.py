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
        res = self.client.get('/api/1/metadata')
        assert res.status_code == 200, res
        assert 'countries' in res.json, res.json
        countries = res.json['countries']
        assert 'ar' in countries, countries
        assert countries['ar'] == 'Argentina', countries
