from prometheus_client import make_wsgi_app
from prometheus_client.core import CollectorRegistry

from aleph.metrics.collectors import InfoCollector, DatabaseCollector, QueuesCollector


def create_app():
    registry = CollectorRegistry()
    registry.register(InfoCollector())
    registry.register(DatabaseCollector())
    registry.register(QueuesCollector())

    return make_wsgi_app(registry=registry)


app = create_app()
