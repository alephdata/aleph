from aleph.tests.util import TestCase

HDR = 'X-Aleph-Session'


class AuditApiTestCase(TestCase):

    def setUp(self):
        super(AuditApiTestCase, self).setUp()

    def test_querylog_anonymous(self):
        headers = {}
        headers[HDR] = 'foo'
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res.json

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res.json
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

    def test_delete_querylog(self):
        _, headers = self.login()
        headers[HDR] = 'foo'
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res

        res = self.client.get('/api/2/search?q=foo', headers=headers)
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 1, res

        res = self.client.delete('/api/2/querylog?query=bar', headers=headers)
        assert res.status_code == 404
        res = self.client.delete('/api/2/querylog?query=foo', headers=headers)
        assert res.status_code == 204
        res = self.client.get('/api/2/querylog', headers=headers)
        assert res.json['total'] == 0, res
