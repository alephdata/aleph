from aleph.tests.util import TestCase

HDR = 'X-Aleph-Session'


class AuditApiTestCase(TestCase):

    def setUp(self):
        super(AuditApiTestCase, self).setUp()

    def test_querylog_anonymous(self):
        headers = {}
        headers[HDR] = 'foo'
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res
        res0 = res.json['results'][0]
        assert res0['text'] == 'foo', res0
        assert res0['count'] == 2, res0

        headers[HDR] = 'bar'
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res

    def test_querylog_logged_in(self):
        _, headers = self.login()
        headers[HDR] = 'foo'
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res

        headers[HDR] = 'bar'
        res = self.client.get('/api/2/search?q=bar', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 2, res
