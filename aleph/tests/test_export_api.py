from datetime import datetime, timedelta

from aleph.logic.export import create_export, complete_export
from aleph.tests.util import TestCase
from aleph.validation import validate


class ExportApiTestCase(TestCase):
    def setUp(self):
        super(ExportApiTestCase, self).setUp()
        self.load_fixtures()
        self.email = "test@pudo.org"
        self.role_email = self.create_user("with_email", email=self.email)
        _, self.headers = self.login(foreign_id="with_email")

        csv_path = self.get_fixture_path("experts.csv")
        temp_path = self._create_temporary_copy(csv_path, "experts.csv")
        self.export1 = create_export("TEST", self.role_email.id, "test1")
        complete_export(self.export1.id, temp_path, "exports.csv")

        temp_path = self._create_temporary_copy(csv_path, "experts.csv")
        self.export2 = create_export("TEST", self.role_email.id, "test2")
        self.export2.expires_at = datetime.utcnow() + timedelta(days=-1)
        complete_export(self.export2.id, temp_path, "experts.csv")

    def test_anonymous(self):
        res = self.client.get("/api/2/exports")
        assert res.status_code == 401, res

    def test_exports_index(self):
        _, headers = self.login()
        res = self.client.get("/api/2/exports", headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 0, res.json
        res = self.client.get("/api/2/exports", headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert res.json["total"] == 1, res.json
        results = res.json["results"]
        validate(results[0], "Export")
