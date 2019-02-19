from aleph.core import kv
from aleph.tests.util import TestCase


class BaseApiTestCase(TestCase):

    def setUp(self):
        super(BaseApiTestCase, self).setUp()

    def test_404(self):
        res = self.client.get('/banana/split')
        assert res.status_code == 404, res
        assert 'status' in res.json, res.json
        assert 'message' in res.json, res.json

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
        assert 'entities' in res.json, res.json
        assert res.json['entities'] == 0, res.json
        self.load_fixtures('docs.yaml')
        kv.flushall()
        res = self.client.get('/api/2/statistics')
        assert res.status_code == 200, res
        assert res.json['entities'] == 4, res.json

    def test_sitemap(self):
        self.load_fixtures('docs.yaml')
        res = self.client.get('/api/2/sitemap.xml')
        assert res.status_code == 200, res
        data = res.data.decode('utf-8')
        assert '<sitemapindex' in data, data
        assert '<sitemap>' in data, data
