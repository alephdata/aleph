import json
from io import BytesIO
from pprint import pprint  # noqa

from aleph.model import Document
from aleph.tests.util import TestCase
from aleph.queues import get_status, OP_INGEST
from aleph.logic.collections import reindex_collection


class IngestApiTestCase(TestCase):
    def setUp(self):
        super(IngestApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id="user_3")
        self.col = self.create_collection()
        self.url = "/api/2/collections/%s/ingest" % self.col.id

    def test_upload_logged_out(self):
        data = {"meta": json.dumps({})}
        res = self.client.post(self.url, data=data)
        assert res.status_code == 403, res

    def test_upload_no_meta(self):
        _, headers = self.login(is_admin=True)
        data = {"meta": "hihi"}
        res = self.client.post(self.url, data=data, headers=headers)
        assert res.status_code == 400, res

    def test_upload_csv_doc(self):
        _, headers = self.login(is_admin=True)
        meta = {
            "countries": ["de", "usa"],
            "languages": ["en"],
            "mime_type": "text/csv",
            "source_url": "http://pudo.org/experts.csv",
        }
        csv_path = self.get_fixture_path("experts.csv")
        data = {
            "meta": json.dumps(meta),
            "foo": open(csv_path, "rb"),
        }
        res = self.client.post(self.url, data=data, headers=headers)
        assert res.status_code == 201, (res, res.data)
        assert "id" in res.json, res.json

        db_id, _ = res.json.get("id").split(".", 1)
        doc = Document.by_id(db_id)
        assert doc.schema == Document.SCHEMA, doc.schema
        assert doc.meta["countries"] == ["de", "us"], doc.meta
        assert doc.meta["languages"] == ["eng"], doc.meta

        status = get_status(self.col)
        assert status.get("pending") == 1, status

    def test_invalid_meta(self):
        _, headers = self.login(is_admin=True)
        meta = {"title": 3, "file_name": ""}
        data = {
            "meta": json.dumps(meta),
            "foo": (BytesIO(b"this is a futz with a banana"), "futz.html"),
        }
        res = self.client.post(self.url, data=data, headers=headers)
        assert res.status_code == 400, res

    def test_invalid_directory_without_foreign_id(self):
        _, headers = self.login(is_admin=True)
        meta = {"title": "test"}
        data = {"meta": json.dumps(meta)}
        res = self.client.post(self.url, data=data, headers=headers)
        assert res.status_code == 400, res

    def test_directory_with_file(self):
        _, headers = self.login(is_admin=True)
        meta = {
            "file_name": "directory",
            "foreign_id": "directory",
            "schema": "Folder",
            "collection_id": self.col.id,
        }
        data = {"meta": json.dumps(meta)}
        res = self.client.post(self.url, data=data, headers=headers)
        assert res.status_code == 201, res
        assert "id" in res.json, res.json
        directory = res.json["id"]

        meta = {
            "file_name": "subdirectory",
            "foreign_id": "subdirectory",
            "parent": {"id": directory},
            "collection_id": self.col.id,
        }
        data = {"meta": json.dumps(meta)}
        res = self.client.post(self.url, data=data, headers=headers)
        assert res.status_code == 201, res
        reindex_collection(self.col)
        assert "id" in res.json, res.json
        url = "/api/2/entities/%s" % res.json["id"]
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        props = res.json.get("properties")
        assert "subdirectory" in props["fileName"], res.json
