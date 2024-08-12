import os

from prometheus_client import CollectorRegistry
import time_machine

from aleph.tests.util import TestCase
from aleph.settings import SETTINGS
from aleph.metrics.collectors import (
    DatabaseCollector,
    QueuesCollector,
    StatisticsCollector,
)
from aleph.model import Role, Bookmark, EntitySet, Collection
from aleph.core import db, kv
from aleph.index.entities import index_entity
from aleph.logic.collections import compute_collections
from aleph.queues import dataset_from_collection
from aleph.util import random_id

from servicelayer.taskqueue import Dataset


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

        with time_machine.travel("2100-01-01T00:00:00Z"):
            self.create_user(foreign_id="user_1")

        with time_machine.travel("2100-01-08T00:00:00Z"):
            self.create_user(foreign_id="user_2")

        with time_machine.travel("2100-01-08T12:00:00Z"):
            reg.collect()
            assert reg.get_sample_value("aleph_users", {"active": "24h"}) == 1
            assert reg.get_sample_value("aleph_users", {"active": "7d"}) == 1
            assert reg.get_sample_value("aleph_users", {"active": "30d"}) == 2
            assert reg.get_sample_value("aleph_users", {"active": "90d"}) == 2
            assert reg.get_sample_value("aleph_users", {"active": "365d"}) == 2

            # includes the default superuser
            assert reg.get_sample_value("aleph_users", {"active": "ALL_TIME"}) == 3

    def test_collection_categories(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        user = self.create_user(is_admin=True)
        self.create_collection(creator=user, category="casefile")
        self.create_collection(creator=user, category="leak")

        reg.collect()
        casefiles = reg.get_sample_value(
            "aleph_collection_categories",
            {"category": "casefile", "type": "casefile"},
        )
        leaks = reg.get_sample_value(
            "aleph_collection_categories",
            {"category": "leak", "type": "dataset"},
        )
        assert casefiles == 1
        assert leaks == 1

    def test_collection_countries(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        user = self.create_user(is_admin=True)
        self.create_collection(
            creator=user,
            category="casefile",
            countries=["de", "fr"],
        )
        self.create_collection(
            creator=user,
            category="leak",
            countries=["fr", "lu"],
        )

        reg.collect()
        de = reg.get_sample_value(
            "aleph_collection_countries",
            {"country": "de", "type": "casefile"},
        )
        lu = reg.get_sample_value(
            "aleph_collection_countries",
            {"country": "lu", "type": "dataset"},
        )
        fr_casefile = reg.get_sample_value(
            "aleph_collection_countries",
            {"country": "fr", "type": "casefile"},
        )
        fr_dataset = reg.get_sample_value(
            "aleph_collection_countries",
            {"country": "fr", "type": "dataset"},
        )
        assert de == 1
        assert lu == 1
        assert fr_casefile == 1
        assert fr_dataset == 1

    def test_collection_languages(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        user = self.create_user(is_admin=True)
        self.create_collection(
            creator=user,
            category="casefile",
            languages=["fra", "eng"],
        )
        self.create_collection(
            creator=user,
            category="leak",
            languages=["fra", "nld"],
        )

        reg.collect()
        eng = reg.get_sample_value(
            "aleph_collection_languages",
            {"language": "eng", "type": "casefile"},
        )
        nld = reg.get_sample_value(
            "aleph_collection_languages",
            {"language": "nld", "type": "dataset"},
        )
        fra_casefile = reg.get_sample_value(
            "aleph_collection_languages",
            {"language": "fra", "type": "casefile"},
        )
        fra_dataset = reg.get_sample_value(
            "aleph_collection_languages",
            {"language": "fra", "type": "dataset"},
        )

        assert eng == 1
        assert nld == 1
        assert fra_casefile == 1
        assert fra_dataset == 1

    def test_collection_users(self):
        reg = CollectorRegistry()
        reg.register(DatabaseCollector())

        user_1 = self.create_user(foreign_id="user_1")
        self.create_user(foreign_id="user_2")
        self.create_collection(creator=user_1)
        self.create_collection(creator=user_1)

        assert Collection.all_casefiles().count() == 2
        assert Role.all_users().count() == 3  # 2 + super user
        assert reg.get_sample_value("aleph_collection_users") == 1

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

        task_id = random_id()
        dataset = Dataset(conn=kv, name=dataset_from_collection(col))
        dataset.add_task(task_id, "index")

        reg.collect()
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "pending"}
        )
        assert count == 1, count

        # Fetch tasks from queue and mark them as running
        dataset.checkout_task(task_id, "index")

        reg.collect()
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "pending"}
        )
        assert count == 0, count
        count = reg.get_sample_value(
            "aleph_tasks", {"stage": "index", "status": "running"}
        )
        assert count == 1, count

    def test_entities(self):
        reg = CollectorRegistry()
        reg.register(StatisticsCollector())

        collection_1 = self.create_collection()
        entity_1 = self.create_entity(
            collection=collection_1,
            data={"schema": "Person", "properties": {}},
        )

        collection_2 = self.create_collection()
        entity_2 = self.create_entity(
            collection=collection_2,
            data={"schema": "Person", "properties": {}},
        )

        index_entity(entity_1)
        index_entity(entity_2)

        # This is usually executed periodically by a worker
        compute_collections()

        reg.collect()
        persons = reg.get_sample_value("aleph_entities", {"schema": "Person"})
        assert persons == 2
