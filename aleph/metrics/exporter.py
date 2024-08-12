from prometheus_client import make_wsgi_app, PLATFORM_COLLECTOR
from prometheus_client.core import CollectorRegistry

from aleph.metrics.collectors import (
    InfoCollector,
    DatabaseCollector,
    QueuesCollector,
    StatisticsCollector,
)


def create_app():
    registry = CollectorRegistry()
    registry.register(PLATFORM_COLLECTOR)
    registry.register(InfoCollector())
    registry.register(DatabaseCollector())
    registry.register(QueuesCollector())
    registry.register(StatisticsCollector())

    return make_wsgi_app(registry=registry)


app = create_app()
