import os

from prometheus_client import CollectorRegistry

from aleph.tests.util import TestCase
from aleph.settings import SETTINGS
from aleph.metrics.collectors import DatabaseCollector, QueuesCollector
from aleph.model import Role, Bookmark, EntitySet
from aleph.core import db
from aleph.queues import get_stage


class MetricsTestCase(TestCase):
    def test_metrics_endpoint_enabled(self):
        # Depending on the value of `PROMETHEUS_ENABLED` the metrics endpoint
        # is mounted app when the Flask app is initialized, so we need to recreate
        # it after changing the value of the setting.
        SETTINGS.PROMETHEUS_ENABLED = False
        self.init_app()

        res = self.client.get("/metrics", base_url="http://localhost:9100")
        assert res.status_code == 404

        res = self.client.get("/metrics", base_url="http://localhost:5000")
        assert res.status_code == 404

        SETTINGS.PROMETHEUS_ENABLED = True
        os.environ["PROMETHEUS_MULTIPROC_DIR"] = "/var/run"
        self.init_app()

        res = self.client.get("/metrics", base_url="http://localhost:9100")
        assert res.status_code == 200

        res = self.client.get("/metrics", base_url="http://localhost:5000")
        assert res.status_code == 404

    def test_users(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        # Sanity check: Aleph creates a superuser by default
        users = list(Role.all_users())
        assert users[0].foreign_id == "system:aleph"

        reg.collect()
        assert reg.get_sample_value("aleph_users") == 1

        self.create_user()

        reg.collect()
        assert reg.get_sample_value("aleph_users") == 2

    def test_collections(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())
        labels = {"category": "casefile"}

        reg.collect()
        counter = reg.get_sample_value("aleph_collections", labels)
        users = reg.get_sample_value("aleph_collection_users", labels)
        assert counter is None, counter
        assert counter is None, counter

        user = self.create_user()
        self.create_collection(creator=user)
        self.create_collection(creator=user)

        reg.collect()
        counter = reg.get_sample_value("aleph_collections", labels)
        users = reg.get_sample_value("aleph_collection_users", labels)
        assert counter == 2, counter
        assert users == 1, users

    def test_entitysets(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        reg.collect()
        count = reg.get_sample_value("aleph_entitysets", {"type": "diagram"})
        users = reg.get_sample_value("aleph_entityset_users", {"type": "diagram"})
        assert count is None, count
        assert users is None, users

        user = self.create_user()
        col = self.create_collection(creator=user)

        entityset = EntitySet(
            id="1",
            role_id=user.id,
            collection_id=col.id,
            type="diagram",
            label="Test Diagram 1",
        )
        db.session.add(entityset)
        entityset = EntitySet(
            id="2",
            collection_id=col.id,
            role_id=user.id,
            type="diagram",
            label="Test Diagram 2",
        )
        db.session.add(entityset)
        db.session.commit()

        reg.collect()
        count = reg.get_sample_value("aleph_entitysets", {"type": "diagram"})
        users = reg.get_sample_value("aleph_entityset_users", {"type": "diagram"})
        assert count == 2, count
        assert users == 1, users

    def test_bookmarks(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        reg.collect()
        count = reg.get_sample_value("aleph_bookmarks")
        users = reg.get_sample_value("aleph_bookmark_users")
        assert count == 0, count
        assert users == 0, users

        user = self.create_user()
        col = self.create_collection(user, label="Test Collection")

        company = self.create_entity(data={"schema": "Company"}, collection=col)
        person = self.create_entity(data={"schema": "Person"}, collection=col)

        bookmark = Bookmark(entity_id=company.id, collection_id=col.id, role_id=user.id)
        db.session.add(bookmark)
        bookmark = Bookmark(entity_id=person.id, collection_id=col.id, role_id=user.id)
        db.session.add(bookmark)
        db.session.commit()

        reg.collect()
        count = reg.get_sample_value("aleph_bookmarks")
        users = reg.get_sample_value("aleph_bookmark_users")
        assert count == 2, count
        assert users == 1, users

    def test_tasks(self):
        reg = CollectorRegistry()
        reg.register(QueuesCollector())

        reg.collect()
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "pending"}
        )
        assert count is None, count
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "pending"}
        )
        assert count is None, count

        col = self.create_collection()
        entity = self.create_entity(data={"schema": "Company"}, collection=col)

        stage = get_stage(collection=col, stage="index")
        stage.queue({"entity_id": entity.id})

        reg.collect()
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "pending"}
        )
        assert count == 1, count

        # Fetch tasks from queue and mark them as running
        tasks = stage.get_tasks(limit=1)
        assert len(tasks) == 1, tasks

        reg.collect()
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "pending"}
        )
        assert count == 0, count
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "running"}
        )
        assert count == 1, count
