from aleph.views.util import validate
from aleph.tests.util import TestCase

HDR = 'X-Aleph-Session'


class QueryLogApiTestCase(TestCase):

    def setUp(self):
        super(QueryLogApiTestCase, self).setUp()

    def test_querylog_anonymous(self):
        res = self.client.get('/api/2/querylog')
        assert res.status_code == 403, res.status_code

    def test_querylog_logged_in(self):
        _, headers = self.login()
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res

        res = self.client.get('/api/2/search?q=bar', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 2, res
        validate(res.json['results'][0], 'QueryLog')
        validate(res.json['results'][1], 'QueryLog')

    def test_delete_querylog(self):
        _, headers = self.login()
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res

        res = self.client.delete('/api/2/querylog?query=bar', headers=headers)
        assert res.status_code == 204
        res = self.client.delete('/api/2/querylog?query=foo', headers=headers)
        assert res.status_code == 204
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res
