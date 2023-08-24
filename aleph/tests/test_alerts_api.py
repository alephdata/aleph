import json

from aleph.core import db
from aleph.model import Alert
from aleph.views.util import validate
from aleph.tests.util import TestCase, JSON


class AlertsApiTestCase(TestCase):
    def setUp(self):
        super(AlertsApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get("/api/2/alerts")
        assert res.status_code == 401, res
        _, headers = self.login()
        res = self.client.get("/api/2/alerts", headers=headers)
        assert res.status_code == 200, res
        assert res.json.get("total") == 0, res.json
        validate(res.json, "QueryResponse")

    def test_create(self):
        data = {"query": "banana pumpkin"}
        jdata = json.dumps(data)
        res = self.client.post("/api/2/alerts", data=jdata, content_type=JSON)
        assert res.status_code == 401, res
        _, headers = self.login()
        res = self.client.post(
            "/api/2/alerts",
            data=jdata,
            headers=headers,
            content_type=JSON,
        )
        assert res.status_code == 200, res.json
        validate(res.json, "Alert")
        assert "banana pumpkin" in res.json["query"], res.json
        for wrong_data in [{"query": 2}, {"quarry": "stone"}]:
            wdata = json.dumps(wrong_data)
            res = self.client.post(
                "/api/2/alerts",
                data=wdata,
                headers=headers,
                content_type=JSON,
            )
            assert res.status_code == 400, res.json

    def test_create_with_query(self):
        data = {"query": "putin"}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post(
            "/api/2/alerts",
            data=jdata,
            headers=headers,
            content_type=JSON,
        )
        assert res.status_code == 200, res.json
        validate(res.json, "Alert")
        assert res.json["query"] == "putin", res.json

    def test_view(self):
        data = {"query": "putin"}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post(
            "/api/2/alerts",
            data=jdata,
            headers=headers,
            content_type=JSON,
        )
        url = "/api/2/alerts/%s" % res.json["id"]
        res2 = self.client.get(url, headers=headers)
        assert res2.json["id"] == res.json["id"], res2.json
        validate(res.json, "Alert")

        res3 = self.client.get("/api/2/alerts/100000", headers=headers)
        assert res3.status_code == 404, res3

    def test_delete(self):
        data = {"query": "putin"}
        jdata = json.dumps(data)
        _, headers = self.login()
        res = self.client.post(
            "/api/2/alerts",
            data=jdata,
            headers=headers,
            content_type=JSON,
        )
        assert res.status_code == 200, res.status_code

        count = Alert.all().count()
        url = "/api/2/alerts/%s" % res.json["id"]
        res = self.client.delete(url, headers=headers)
        assert res.status_code == 204, res.json
        new_count = Alert.all().count()
        real_count = db.session.query(Alert).count()
        assert new_count == real_count, (count, real_count)
        assert new_count == (count - 1), (count, new_count)
