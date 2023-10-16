from urllib.parse import urlparse
from flask import request
from werkzeug.exceptions import NotFound
from timeit import default_timer
from prometheus_client import (
    generate_latest,
    CollectorRegistry,
    Counter,
    Histogram,
    CONTENT_TYPE_LATEST,
)
from prometheus_client.multiprocess import MultiProcessCollector
from aleph.settings import SETTINGS

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "Duration of requests to the Aleph API in seconds",
    ["method", "status", "endpoint"],
)

REQUEST = Counter(
    "http_request_total",
    "Total number of Aleph API requests",
    ["method", "status", "endpoint", "logged_in"],
)


def before_request():
    request.prometheus_start_time = default_timer()


def after_request(response):
    endpoint = request.endpoint

    # Do not track request duration for the metrics endpoint
    if endpoint == "metrics":
        return response

    method = request.method
    status = response.status_code
    logged_in = request.authz.logged_in
    duration = max(0, default_timer() - request.prometheus_start_time)

    REQUEST.labels(method, status, endpoint, logged_in).inc()
    REQUEST_DURATION.labels(method, status, endpoint).observe(duration)

    return response


def create_metrics_endpoint():
    # Hacky workaround to prevent circular imports on app startup
    from .collectors import InfoCollector, DatabaseCollector, QueuesCollector

    def metrics():
        # Make metrics available on internal port only
        url = urlparse(request.url)

        if url.port != SETTINGS.PROMETHEUS_PORT:
            raise NotFound()

        # The Prometheus client does not support using custom collectors in multi-process
        # mode. We work around that by setting up two registries. The default registry uses
        # a multi-process collector to collect metrics such as request durations etc. across
        # all application processes. The second is a single-process registry for use with
        # our custom collectors.
        custom_collectors_registry = CollectorRegistry()
        custom_collectors_registry.register(InfoCollector())
        custom_collectors_registry.register(DatabaseCollector())
        custom_collectors_registry.register(QueuesCollector())

        default_registry = CollectorRegistry()
        MultiProcessCollector(default_registry)

        registries = [custom_collectors_registry, default_registry]
        body = "\n".join(generate_latest(r).decode("utf-8") for r in registries)
        headers = {"Content-Type": CONTENT_TYPE_LATEST}

        return body, 200, headers

    return metrics


class PrometheusExtension:
    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        if not SETTINGS.PROMETHEUS_ENABLED:
            return

        app.before_request(before_request)
        app.after_request(after_request)

        metrics_endpoint = create_metrics_endpoint()
        app.add_url_rule("/metrics", view_func=metrics_endpoint)
