import datetime
from collections import defaultdict

from sqlalchemy import func, case
from prometheus_client.core import GaugeMetricFamily, InfoMetricFamily
from prometheus_client.registry import Collector
from followthemoney import __version__ as ftm_version

from aleph import __version__ as aleph_version
from aleph.core import create_app as create_flask_app
from aleph.index.collections import get_collection_stats
from aleph.queues import get_active_dataset_status
from aleph.model import Role, Collection, EntitySet, Bookmark


class InfoCollector(Collector):
    def collect(self):
        yield InfoMetricFamily(
            "aleph_system",
            "Aleph system information",
            value={
                "aleph_version": aleph_version,
                "ftm_version": ftm_version,
            },
        )


class DatabaseCollector(Collector):
    def __init__(self):
        self._flask_app = create_flask_app()

    def collect(self):
        with self._flask_app.app_context():
            yield self._users()

            # In theory, these could be one metric with multiple labels for categories,
            # countries, and languages, but this would result in a very high cardinality.
            yield self._collection_categories()
            yield self._collection_countries()
            yield self._collection_languages()

            yield self._collection_users()
            yield self._entitysets()
            yield self._entityset_users()
            yield self._bookmarks()
            yield self._bookmark_users()

    def _users(self):
        periods = {
            "24h": datetime.timedelta(hours=24),
            "7d": datetime.timedelta(days=7),
            "30d": datetime.timedelta(days=30),
            "90d": datetime.timedelta(days=90),
            "365d": datetime.timedelta(days=365),
        }

        gauge = GaugeMetricFamily(
            "aleph_users",
            "Total number of users",
            labels=["active"],
        )

        gauge.add_metric(["ALL_TIME"], Role.all_users().count())

        for label, delta in periods.items():
            now = datetime.datetime.now(datetime.timezone.utc)
            limit = now - delta

            count = Role.all_users().filter(Role.updated_at >= limit).count()

            gauge.add_metric([label], count)

        return gauge

    def _collection_categories(self):
        gauge = GaugeMetricFamily(
            "aleph_collection_categories",
            "Total number of collections by category",
            labels=["category", "type"],
        )

        # This is just a convenience to make querying the Prometheus metrics easier,
        # but it doesn’t change metric cardinality because category implies type.
        type_ = case(
            (Collection.category == "casefile", "casefile"),
            else_="dataset",
        )

        query = (
            Collection.all()
            .with_entities(Collection.category, type_, func.count())
            .group_by(Collection.category, type_)
        )

        for category, type_, count in query:
            gauge.add_metric([category, type_], count)

        return gauge

    def _collection_countries(self):
        gauge = GaugeMetricFamily(
            "aleph_collection_countries",
            "Total number of collections by country",
            labels=["country", "type"],
        )

        country = func.unnest(Collection.countries).label("country")
        type_ = case(
            (Collection.category == "casefile", "casefile"),
            else_="dataset",
        )
        query = (
            Collection.all()
            .with_entities(country, type_, func.count())
            .group_by(country, type_)
        )

        for country, type_, count in query:
            gauge.add_metric([country, type_], count)

        return gauge

    def _collection_languages(self):
        gauge = GaugeMetricFamily(
            "aleph_collection_languages",
            "Total number of collections by language",
            labels=["language", "type"],
        )

        lang = func.unnest(Collection.languages).label("country")
        type_ = case(
            (Collection.category == "casefile", "casefile"),
            else_="dataset",
        )
        query = (
            Collection.all()
            .with_entities(lang, type_, func.count())
            .group_by(lang, type_)
        )

        for lang, type_, count in query:
            gauge.add_metric([lang, type_], count)

        return gauge

    def _collection_users(self):
        query = Collection.all().with_entities(
            func.count(func.distinct(Collection.creator_id)),
        )

        return GaugeMetricFamily(
            "aleph_collection_users",
            "Total number of users that have created at least one collection",
            value=query.scalar(),
        )

    def _entitysets(self):
        gauge = GaugeMetricFamily(
            "aleph_entitysets",
            "Total number of entity set by type",
            labels=["type"],
        )

        query = (
            EntitySet.all()
            .with_entities(EntitySet.type, func.count())
            .group_by(EntitySet.type)
        )

        for entityset_type, count in query:
            gauge.add_metric([entityset_type], count)

        return gauge

    def _entityset_users(self):
        gauge = GaugeMetricFamily(
            "aleph_entityset_users",
            "Number of users that have created at least on entity set of the given type",
            labels=["type"],
        )

        query = (
            EntitySet.all()
            .with_entities(
                EntitySet.type,
                func.count(func.distinct(EntitySet.role_id)),
            )
            .group_by(EntitySet.type)
        )

        for entityset_type, count in query:
            gauge.add_metric([entityset_type], count)

        return gauge

    def _bookmarks(self):
        return GaugeMetricFamily(
            "aleph_bookmarks",
            "Total number of bookmarks",
            value=Bookmark.query.count(),
        )

    def _bookmark_users(self):
        return GaugeMetricFamily(
            "aleph_bookmark_users",
            "Number of users that have created at least one bookmark",
            value=Bookmark.query.distinct(Bookmark.role_id).count(),
        )


class QueuesCollector(Collector):
    def collect(self):
        status = get_active_dataset_status()

        yield GaugeMetricFamily(
            "aleph_active_datasets",
            "Total number of active datasets",
            value=status["total"],
        )

        stages = {}

        for collection_status in status["datasets"].values():
            for stage_status in collection_status["stages"]:
                stage = stage_status["stage"]
                pending = stage_status["pending"]
                running = stage_status["running"]

                if stage not in stages:
                    stages[stage] = {
                        "pending": 0,
                        "running": 0,
                    }

                stages[stage] = {
                    "pending": stages[stage].get("pending") + pending,
                    "running": stages[stage].get("running") + running,
                }

        tasks_gauge = GaugeMetricFamily(
            "aleph_tasks",
            "Total number of pending or running tasks in a given stage",
            labels=["stage", "status"],
        )

        for stage, tasks in stages.items():
            tasks_gauge.add_metric([stage, "pending"], tasks["pending"])
            tasks_gauge.add_metric([stage, "running"], tasks["running"])

        yield tasks_gauge


class StatisticsCollector(Collector):
    def __init__(self):
        self._flask_app = create_flask_app()

    def collect(self):
        with self._flask_app.app_context():
            yield self._entities()

    def _entities(self):
        gauge = GaugeMetricFamily(
            "aleph_entities",
            "Total number of entities by FollowTheMoney schema",
            labels=["schema"],
        )

        stats = defaultdict(lambda: 0)

        for collection in Collection.all().yield_per(1000):
            collection_stats = get_collection_stats(collection.id)
            schemata = collection_stats["schema"]["values"]

            for schema, count in schemata.items():
                stats[schema] += count

        for schema, count in stats.items():
            gauge.add_metric([schema], count)

        return gauge
