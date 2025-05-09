import json

from datetime import datetime
import time_machine

from aleph.core import db
from aleph.settings import SETTINGS
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

        SETTINGS.REQUIRE_LOGGED_IN = True
        res = self.client.get("/api/2/collections")
        assert res.status_code == 403, res
        SETTINGS.REQUIRE_LOGGED_IN = False

        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/collections", headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        assert res.json["results"][0]["languages"] == ["eng"], res.json
        assert res.json["results"][0]["countries"] == ["us"], res.json
        assert validate(res.json["results"][0], "Collection")

    def test_index_fuzzy_search(self):
        _, headers = self.login(is_admin=True)

        # Note the typo in "Colection"
        res = self.client.get("/api/2/collections?q=Test Colection", headers=headers)

        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        assert res.json["results"][0]["label"] == "Test Collection"

    def test_index_advanced_search(self):
        _, headers = self.login(is_admin=True)
        self.col = self.create_collection(
            label="OpenContracting",
            category="procurement",
        )

        res = self.client.get("/api/2/collections?q=Open*", headers=headers)

        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        assert res.json["results"][0]["label"] == "OpenContracting"

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

    def test_create_foreign_id(self):
        role, headers = self.login()
        _, headers_other = self.login(foreign_id="other")
        collection = self.create_collection(foreign_id="foo", label="foo", creator=role)

        url = "/api/2/collections"
        data = {"foreign_id": "foo", "label": "bar"}

        res = self.client.post(url, json=data, headers=headers_other)
        assert res.status_code == 400

        res = self.client.post(url, json=data, headers=headers)
        assert res.status_code == 400

        # Sanity check: The collection label is still the original one
        collection_url = f"/api/2/collections/{collection.id}"
        res = self.client.get(collection_url, headers=headers)
        assert res.json["foreign_id"] == "foo"
        assert res.json["label"] == "foo"

        # After deleting the collection, a new collection with the foreign ID
        # can be created by the creator of the original collection
        res = self.client.delete(collection_url, headers=headers)
        assert res.status_code == 204

        res = self.client.post(url, json=data, headers=headers_other)
        assert res.status_code == 400

        res = self.client.post(url, json=data, headers=headers)
        assert res.status_code == 200

        res = self.client.get(collection_url, headers=headers)
        assert res.json["foreign_id"] == "foo"
        assert res.json["label"] == "bar"

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
        SETTINGS.INDEXING_BATCH_SIZE = 1

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

    def test_bulk_api_flags(self):
        _, headers = self.login(is_admin=True)
        data = json.dumps(
            [
                {
                    "id": "4345800498380953840",
                    "schema": "LegalEntity",
                    "properties": {"name": "Barbra W. Vaughn", "phone": "+19046426847"},
                },
                {
                    "id": "7598743983789743598",
                    "schema": "LegalEntity",
                    "properties": {"name": "Marion C. Bostic", "phone": "123456"},
                },
            ]
        )
        url = "/api/2/collections/%s/_bulk?clean=False" % self.col.id
        res = self.client.post(url, headers=headers, data=data)
        assert res.status_code == 204, res
        query = "/api/2/entities?filter:schemata=LegalEntity&filter:collection_id=%s"
        query = query % self.col.id
        res = self.client.get(query, headers=headers)
        assert "phone" in res.json["results"][0]["properties"], res.json
        assert "phone" in res.json["results"][1]["properties"], res.json
        url = "/api/2/collections/%s/_bulk" % self.col.id
        res = self.client.post(url, headers=headers, data=data)
        assert res.status_code == 204, res
        query = "/api/2/entities?filter:schemata=LegalEntity&filter:collection_id=%s"
        query = query % self.col.id
        res = self.client.get(query, headers=headers)
        assert "phone" in res.json["results"][0]["properties"], res.json
        assert "phone" not in res.json["results"][1]["properties"], res.json

    def test_bulk_entitysets_api(self):
        SETTINGS.INDEXING_BATCH_SIZE = 1

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

    def test_touch(self):
        url = f"/api/2/collections/{self.col.id}/touch"
        res = self.client.post(url)
        assert res.status_code == 403, res

        _, headers = self.login(is_admin=True)

        url = f"/api/2/collections/{self.col.id}"
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert res.json.get("data_updated_at", None) is None

        url = f"/api/2/collections/{self.col.id}/touch"
        res = self.client.post(url, headers=headers)
        assert res.status_code == 202, res

        url = f"/api/2/collections/{self.col.id}"
        res = self.client.get(url, headers=headers)
        updated_at_timestamp = datetime.fromisoformat(res.json["data_updated_at"])

        fake_timestamp = "2001-04-02T09:45:04.112439"
        with time_machine.travel(fake_timestamp):
            url = f"/api/2/collections/{self.col.id}/touch"
            res = self.client.post(url, headers=headers)
            assert res.status_code == 202, res

            url = f"/api/2/collections/{self.col.id}"
            res = self.client.get(url, headers=headers)
            fake_updated_at_timestamp = datetime.fromisoformat(
                res.json["data_updated_at"]
            )
            assert (
                fake_updated_at_timestamp.year
                == datetime.fromisoformat(fake_timestamp).year
            )

            assert fake_updated_at_timestamp < updated_at_timestamp
