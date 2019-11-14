from aleph.tests.util import TestCase
from aleph.views.forms import Schema


class DashboardApiTestCase(TestCase):

    def setUp(self):
        super(DashboardApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get('/api/2/status')
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.get('/api/2/status',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json.get('total') == 0, res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/status',
                              headers=headers)
        assert res.status_code == 200, res
        assert res.json.get('total') == 0, res.json
        schema = Schema(schema='SystemStatusResponse')
        schema.validate(res.json)
