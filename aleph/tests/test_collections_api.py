from aleph import settings
import json

from aleph.core import db, settings
from aleph.authz import Authz
from aleph.model import EntitySet
from aleph.logic.collections import compute_collection
from aleph.views.util import validate
from aleph.tests.util import TestCase, JSON


class CollectionsApiTestCase(TestCase):
    def setUp(self):
        super(CollectionsApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id="user_3")
        self.col = self.create_collection(
            label="Test Collection",
            foreign_id="test_coll_entities_api",
            category="leak",
            countries=["us"],
            languages=["eng"],
        )
        self.ent = self.create_entity(
            {
                "schema": "Person",
                "properties": {"name": "Winnie the Pooh", "country": "za"},
            },
            self.col,
        )
        db.session.add(self.ent)
        db.session.commit()

    def test_index(self):
        res = self.client.get("/api/2/collections")
        assert res.status_code == 200, res
        assert res.json["total"] == 0, res.json

        settings.REQUIRE_LOGGED_IN = True
        res = self.client.get("/api/2/collections")
        assert res.status_code == 403, res
        settings.REQUIRE_LOGGED_IN = False

        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/collections", headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        assert res.json["results"][0]["languages"] == ["eng"], res.json
        assert res.json["results"][0]["countries"] == ["us"], res.json
        assert validate(res.json["results"][0], "Collection")

    def test_sitemap(self):
        res = self.client.get("/api/2/sitemap.xml")
        assert res.status_code == 200, res
        assert b"<loc>" not in res.data, res.data
        self.grant_publish(self.col)
        res = self.client.get("/api/2/sitemap.xml")
        assert b"<loc>" in res.data, res.data

    def test_view(self):
        res = self.client.get("/api/2/collections/%s" % self.col.id)
        assert res.status_code == 403, res
        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/collections/%s" % self.col.id, headers=headers)
        assert res.status_code == 200, res
        assert "test_coll" in res.json["foreign_id"], res.json
        assert "Winnie" not in res.json["label"], res.json
        assert validate(res.json, "Collection")

    def test_update_valid(self):
        _, headers = self.login(is_admin=True)
        url = "/api/2/collections/%s" % self.col.id
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res

        data = res.json
        data["label"] = "Collected Collection"
        res = self.client.post(
            url, data=json.dumps(data), headers=headers, content_type=JSON
        )
        assert res.status_code == 200, res.json
        assert "Collected" in res.json["label"], res.json
        assert validate(res.json, "Collection")

    def test_update_no_label(self):
        _, headers = self.login(is_admin=True)
        url = "/api/2/collections/%s" % self.col.id
        res = self.client.get(url, headers=headers)
        data = res.json
        data["label"] = ""
        res = self.client.post(
            url, data=json.dumps(data), headers=headers, content_type=JSON
        )
        assert res.status_code == 400, res.json

        res = self.client.get(url, headers=headers)
        data = res.json
        data["category"] = "banana"
        res = self.client.post(
            url, data=json.dumps(data), headers=headers, content_type=JSON
        )
        assert res.status_code == 400, res.json

    def test_delete(self):
        _, headers = self.login(is_admin=True)
        url = "/api/2/collections/%s" % self.col.id
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        res = self.client.delete(url, headers=headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=headers)
        assert res.status_code == 404, res

    def test_bulk_api(self):
        _, headers = self.login(is_admin=True)
        data = json.dumps(
            [
                {
                    "id": "4345800498380953840",
                    "schema": "Person",
                    "properties": {"name": "Osama bin Laden"},
                },
                {
                    "id": "7598743983789743598",
                    "schema": "Person",
                    "properties": {"name": "Osama bin Laden"},
                },
            ]
        )
        url = "/api/2/collections/%s/_bulk" % self.col.id
        res = self.client.post(url, data=data)
        assert res.status_code == 403, res
        res = self.client.post(url, headers=headers, data=data)
        assert res.status_code == 204, res
        query = "/api/2/entities?filter:schemata=Thing&filter:collection_id=%s"
        query = query % self.col.id
        res = self.client.get(query, headers=headers)
        assert res.json["total"] == 2, res.json
        data = [{"schema": "Person", "properties": {"name": "Osama bin Laden"}}]
        res = self.client.post(url, headers=headers, data=json.dumps(data))
        assert res.status_code == 400, res
        res = self.client.get(query, headers=headers)
        assert res.json["total"] == 2, res.json
        data = [
            {
                "id": "7598743983789743598",
                "schema": "Lollipop",
                "properties": {"name": "Osama bin Laden"},
            }
        ]
        res = self.client.post(url, headers=headers, data=json.dumps(data))
        assert res.status_code == 400, res

    def test_bulk_entitysets_api(self):
        role, headers = self.login(is_admin=True)
        authz = Authz.from_role(role)
        data = {"type": EntitySet.LIST, "label": "Foo"}
        eset = EntitySet.create(data, self.col, authz)
        db.session.commit()
        eset_id = eset.id
        data = json.dumps(
            [
                {
                    "id": "4345800498380953840",
                    "schema": "Person",
                    "properties": {"name": "Osama bin Laden"},
                },
                {
                    "id": "7598743983789743598",
                    "schema": "Person",
                    "properties": {"name": "Osama bin Laden"},
                },
            ]
        )
        url = "/api/2/collections/%s/_bulk?entityset_id=%s" % (self.col.id, eset_id)
        res = self.client.post(url, headers=headers, data=data)
        assert res.status_code == 204, res
        query = "/api/2/entitysets/%s/entities?filter:schema=Person" % eset_id
        res = self.client.get(query, headers=headers)
        assert res.json["total"] == 2, res.json

    def test_statistics(self):
        self.load_fixtures()
        compute_collection(self.private_coll, sync=True)
        _, headers = self.login(is_admin=True)
        url = "/api/2/collections/%s" % self.private_coll.id
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        stats = res.json["statistics"]
        assert "Folder" in stats["schema"]["values"], stats
        assert "vladimir_l@example.com" in stats["emails"]["values"], stats

    def test_status(self):
        _, headers = self.login(is_admin=True)
        url = "/api/2/collections/%s/status" % self.col.id
        res = self.client.get(url)
        assert res.status_code == 403, res

        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert 0 == res.json["pending"], res.json

        meta = {
            "countries": ["de", "us"],
            "languages": ["eng"],
            "mime_type": "text/csv",
            "source_url": "http://pudo.org/experts.csv",
            "collection_id": self.col.id,
        }
        csv_path = self.get_fixture_path("experts.csv")
        data = {
            "meta": json.dumps(meta),
            "foo": open(csv_path, "rb"),
        }
        ingest_url = "/api/2/collections/%s/ingest" % self.col.id
        res = self.client.post(ingest_url, data=data, headers=headers)
        assert res.status_code == 201, res

        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert 1 == res.json["pending"], res.json
        assert validate(res.json, "CollectionStatus")

        res = self.client.delete(url)
        assert res.status_code == 403, res

        res = self.client.delete(url, headers=headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert 0 == res.json["pending"], res.json
