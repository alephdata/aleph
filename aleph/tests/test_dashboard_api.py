from aleph.validation import validate
from aleph.tests.util import TestCase


class DashboardApiTestCase(TestCase):
    def setUp(self):
        super(DashboardApiTestCase, self).setUp()

    def test_anonymous(self):
        res = self.client.get("/api/2/status")
        assert res.status_code == 401, res
    
    def test_index(self):
        _, headers = self.login()
        res = self.client.get("/api/2/status", headers=headers)
        assert res.status_code == 200, res
        assert res.json.get("total") == 0, res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/status", headers=headers)
        assert res.status_code == 200, res
        assert res.json.get("total") == 0, res.json
        validate(res.json, "SystemStatusResponse")
