import json
import datetime
from aleph.index.entities import index_entity
from aleph.tests.util import TestCase, JSON
from aleph.model import Bookmark
from aleph.core import db


class BookmarksApiTestCase(TestCase):
    def setUp(self):
        super(BookmarksApiTestCase, self).setUp()

        self.role, self.headers = self.login()
        self.collection = self.create_collection(self.role, label="Politicians")

        data = {"schema": "Person", "properties": {"name": "Angela Merkel"}}
        self.entity = self.create_entity(data=data, collection=self.collection)
        index_entity(self.entity)

    def test_bookmarks_index_auth(self):
        res = self.client.get("/api/2/bookmarks")
        assert res.status_code == 403, res

        res = self.client.get("/api/2/bookmarks", headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 0, res.json

    def test_bookmarks_index_results(self):
        other_role, _ = self.login("tester2")
        other_entity = self.create_entity(
            data={"schema": "Person", "properties": {"name": "Barack Obama"}},
            collection=self.collection,
        )
        index_entity(other_entity)

        bookmarks = [
            Bookmark(
                entity_id=self.entity.id,
                collection_id=self.entity.collection_id,
                role_id=self.role.id,
            ),
            Bookmark(
                entity_id=other_entity.id,
                collection_id=self.entity.collection_id,
                role_id=other_role.id,
            ),
        ]
        db.session.add_all(bookmarks)
        db.session.commit()

        res = self.client.get("/api/2/bookmarks", headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        entity = res.json["results"][0]["entity"]
        assert entity["properties"]["name"][0] == "Angela Merkel", res.json

    def test_bookmarks_index_order(self):
        other_entity = self.create_entity(
            data={"schema": "Person", "properties": {"name": "Barack Obama"}},
            collection=self.collection,
        )
        index_entity(other_entity)

        old_bookmark = Bookmark(
            entity_id=self.entity.id,
            collection_id=self.entity.collection_id,
            role_id=self.role.id,
            created_at=datetime.date(2005, 11, 22),
        )
        new_bookmark = Bookmark(
            entity_id=other_entity.id,
            collection_id=other_entity.collection_id,
            role_id=self.role.id,
            created_at=datetime.date(2009, 1, 20),
        )
        db.session.add_all([old_bookmark, new_bookmark])
        db.session.commit()

        res = self.client.get("/api/2/bookmarks", headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 2, res.json
        first = res.json["results"][0]["entity"]
        second = res.json["results"][1]["entity"]
        assert first["properties"]["name"][0] == "Barack Obama", first
        assert second["properties"]["name"][0] == "Angela Merkel", second

    def test_bookmarks_index_access(self):
        other_role = self.create_user(foreign_id="other")
        secret_collection = self.create_collection(other_role, label="Top Secret")

        data = {"schema": "Person", "properties": {"name": ["Mister X"]}}
        secret_entity = self.create_entity(data, secret_collection)
        index_entity(secret_entity)

        bookmark = Bookmark(
            entity_id=secret_entity.id,
            collection_id=secret_entity.collection_id,
            role_id=self.role.id,
        )
        db.session.add(bookmark)
        db.session.commit()

        res = self.client.get("/api/2/bookmarks", headers=self.headers)

        assert res.status_code == 200, res
        assert res.json["total"] == 0, res.json
        assert len(res.json["results"]) == 0, res.json

    def test_bookmarks_create(self):
        count = Bookmark.query.count()
        assert count == 0, count

        res = self.client.post(
            "/api/2/bookmarks",
            headers=self.headers,
            data=json.dumps({"entity_id": self.entity.id}),
            content_type=JSON,
        )
        assert res.status_code == 201, res
        entity = res.json.get("entity")
        assert entity["properties"]["name"][0] == "Angela Merkel", res.json

        count = Bookmark.query.count()
        assert count == 1, count
        bookmark = Bookmark.query.first()
        assert bookmark.entity_id == self.entity.id, bookmark.entity_id
        assert bookmark.role_id == self.role.id, bookmark.role_id

    def test_bookmarks_create_validate_access(self):
        other_role = self.create_user(foreign_id="other")
        secret_collection = self.create_collection(other_role, label="Top Secret")

        data = {"schema": "Person", "properties": {"name": ["Mister X"]}}
        secret_entity = self.create_entity(data, secret_collection)
        index_entity(secret_entity)

        res = self.client.post(
            "/api/2/bookmarks",
            headers=self.headers,
            data=json.dumps({"entity_id": secret_entity.id}),
            content_type=JSON,
        )
        assert res.status_code == 400, res
        message = res.json["message"]
        assert message.startswith("Could not bookmark the given entity"), message

        count = Bookmark.query.count()
        assert count == 0, count

    def test_bookmarks_create_validate_exists(self):
        invalid_entity_id = self.create_entity(
            {"schema": "Company"}, self.collection
        ).id

        res = self.client.post(
            "/api/2/bookmarks",
            headers=self.headers,
            data=json.dumps({"entity_id": invalid_entity_id}),
            content_type=JSON,
        )
        assert res.status_code == 400, res
        message = res.json["message"]
        assert message.startswith("Could not bookmark the given entity"), message

        count = Bookmark.query.count()
        assert count == 0, count

    def test_bookmarks_create_idempotent(self):
        count = Bookmark.query.count()
        assert count == 0, count

        res = self.client.post(
            "/api/2/bookmarks",
            headers=self.headers,
            data=json.dumps({"entity_id": self.entity.id}),
            content_type=JSON,
        )
        assert res.status_code == 201

        count = Bookmark.query.count()
        assert count == 1, count

        res = self.client.post(
            "/api/2/bookmarks",
            headers=self.headers,
            data=json.dumps({"entity_id": self.entity.id}),
            content_type=JSON,
        )
        assert res.status_code == 201

        count = Bookmark.query.count()
        assert count == 1, count

    def test_bookmarks_delete(self):
        bookmark = Bookmark(
            entity_id=self.entity.id,
            collection_id=self.entity.collection_id,
            role_id=self.role.id,
        )
        db.session.add(bookmark)
        db.session.commit()

        count = Bookmark.query.count()
        assert count == 1, count

        res = self.client.delete(
            f"/api/2/bookmarks/{self.entity.id}", headers=self.headers
        )
        assert res.status_code == 204, res

        count = Bookmark.query.count()
        assert count == 0, count

    def test_bookmarks_delete_idempotent(self):
        count = Bookmark.query.count()
        assert count == 0, count

        res = self.client.delete(
            f"/api/2/bookmarks/{self.entity.id}", headers=self.headers
        )
        assert res.status_code == 204, res

        count = Bookmark.query.count()
        assert count == 0, count
