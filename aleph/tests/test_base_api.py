from aleph.logic.collections import compute_collections
from aleph.tests.util import TestCase


class BaseApiTestCase(TestCase):
    def setUp(self):
        super(BaseApiTestCase, self).setUp()

    def test_404(self):
        res = self.client.get("/banana/split")
        assert res.status_code == 404, res
        assert "status" in res.json, res.json
        assert "message" in res.json, res.json

    def test_metadata(self):
        res = self.client.get("/api/2/metadata")
        assert res.status_code == 200, res
        assert "categories" in res.json, res.json
        categories = res.json["categories"]
        assert "leak" in categories, categories

    def test_statistics(self):
        res = self.client.get("/api/2/statistics")
        assert res.status_code == 200, res
        assert "things" not in res.json, res.json

        self.load_fixtures()
        compute_collections()
        res = self.client.get("/api/2/statistics")
        assert res.status_code == 200, res
        assert res.json["collections"] == 1, res.json
        assert res.json["things"] == 2, res.json

        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/statistics", headers=headers)
        assert res.status_code == 200, res
        assert res.json["collections"] == 1, res.json
        assert res.json["things"] == 2, res.json
