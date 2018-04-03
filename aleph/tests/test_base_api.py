from aleph.core import cache
from aleph.logic.statistics import get_instance_stats
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
        assert 'count' in res.json, res.json
        assert res.json['count'] == 0, res.json
        cache.delete_memoized(get_instance_stats)
        self.load_fixtures('docs.yaml')
        res = self.client.get('/api/2/statistics')
        assert res.status_code == 200, res
        assert res.json['things'] == 4, res.json
        # assert res.json['schemata']['PlainText'] == 1, res.json
        # assert res.json['schemata']['Pages'] == 1, res.json
        # assert res.json['schemata']['Table'] == 1, res.json
