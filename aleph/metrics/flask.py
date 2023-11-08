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

METRICS_ENDPOINT_NAME = "metrics"

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "Duration of requests to the Aleph API in seconds",
    ["method", "status", "api_endpoint"],
)

REQUEST = Counter(
    "http_request_total",
    "Total number of Aleph API requests",
    ["method", "status", "api_endpoint", "logged_in"],
)


def before_request():
    request.prometheus_start_time = default_timer()


def after_request(response):
    api_endpoint = request.endpoint

    # Do not track request duration for the metrics and healthz endpoints
    if api_endpoint == METRICS_ENDPOINT_NAME or api_endpoint == "base_api.healthz":
        return response

    method = request.method
    status = response.status_code

    logged_in = False

    # In theory, there should always be an Authz object. However in practice,
    # this isn’t always the case, but I haven’t been able to reliably reproduce that.
    if hasattr(request, "authz"):
        logged_in = request.authz.logged_in

    duration = max(0, default_timer() - request.prometheus_start_time)

    REQUEST.labels(method, status, api_endpoint, logged_in).inc()
    REQUEST_DURATION.labels(method, status, api_endpoint).observe(duration)

    return response


def metrics():
    # Make metrics available on internal port only
    url = urlparse(request.url)

    if url.port != SETTINGS.PROMETHEUS_PORT:
        raise NotFound()

    registry = CollectorRegistry()
    MultiProcessCollector(registry)

    body = generate_latest(registry).decode("utf-8")
    headers = {"Content-Type": CONTENT_TYPE_LATEST}

    return body, 200, headers


class PrometheusExtension:
    def init_app(self, app):
        if not SETTINGS.PROMETHEUS_ENABLED:
            return

        app.before_request(before_request)
        app.after_request(after_request)

        app.add_url_rule("/metrics", endpoint=METRICS_ENDPOINT_NAME, view_func=metrics)
