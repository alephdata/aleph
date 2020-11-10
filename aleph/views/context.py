import math
import time
import logging
import threading
from pprint import pformat  # noqa
from banal import hash_data
from datetime import datetime
from flask_babel import get_locale
from flask import request, Response, Blueprint
from werkzeug.exceptions import TooManyRequests

from aleph import __version__
from aleph.queues import get_rate_limit
from aleph.core import settings
from aleph.authz import Authz
from aleph.model import Role

log = logging.getLogger(__name__)
local = threading.local()
blueprint = Blueprint("context", __name__)


class NotModified(Exception):
    """Converts to HTTP status 304."""

    pass


def handle_not_modified(exc):
    return Response(status=304)


def tag_request(**kwargs):
    """Store metadata for structured log output."""
    for tag, value in kwargs.items():
        if value is not None:
            request._log_tags[tag] = value


def enable_cache(vary_user=True, vary=None):
    """Enable caching in the context of a view.

    If desired, instructions on the cache parameters can be included, such as
    if the data is fit for public caches (default: no, vary_user) and what
    values to include in the generation of an etag.
    """
    if not settings.CACHE:
        return

    request._http_cache = True
    request._http_revalidate = vary is not None
    args = sorted(set(request.args.items()))
    cache_parts = [args, vary, request._app_locale]

    if vary_user and request.authz.logged_in:
        cache_parts.extend((request.authz.roles))
        request._http_private = True

    request._http_etag = hash_data(cache_parts)
    if request._http_etag in request.if_none_match:
        raise NotModified()


def _get_remote_ip():
    forwarded_for = request.headers.getlist("X-Forwarded-For")
    if len(forwarded_for):
        return forwarded_for[0]
    return request.remote_addr


def _get_credential_authz(credential):
    if credential is None or not len(credential):
        return
    if " " in credential:
        method, credential = credential.split(" ", 1)
        if method == "Token":
            return Authz.from_token(credential)

    role = Role.by_api_key(credential)
    if role is not None:
        return Authz.from_role(role=role)


def enable_authz(request):
    authz = None

    if "Authorization" in request.headers:
        credential = request.headers.get("Authorization")
        authz = _get_credential_authz(credential)

    if authz is None and "api_key" in request.args:
        authz = _get_credential_authz(request.args.get("api_key"))

    authz = authz or Authz.from_role(role=None)
    request.authz = authz


def enable_rate_limit(request):
    if request.authz.logged_in:
        return
    limit = settings.API_RATE_LIMIT * settings.API_RATE_WINDOW
    request.rate_limit = get_rate_limit(
        _get_remote_ip(), limit=limit, interval=settings.API_RATE_WINDOW, unit=60
    )
    if not request.rate_limit.check():
        raise TooManyRequests("Rate limit exceeded.")


@blueprint.before_app_request
def setup_request():
    """Set some request attributes at the beginning of the request.
    By default, caching will be disabled."""
    request._begin_time = time.time()
    request._app_locale = str(get_locale())
    request._session_id = request.headers.get("X-Aleph-Session")
    request._http_cache = False
    request._http_private = False
    request._http_revalidate = False
    request._http_etag = None
    request._log_tags = {}

    enable_authz(request)
    enable_rate_limit(request)


@blueprint.after_app_request
def finalize_response(resp):
    """Post-request processing to set cache parameters."""
    # Compute overall request duration:
    now = time.time()
    took = now - getattr(request, "_begin_time", now)

    # Finalize reporting of the rate limiter:
    if hasattr(request, "rate_limit") and request.rate_limit is not None:
        usage = request.rate_limit.update(amount=math.ceil(took))
        resp.headers["X-Rate-Limit"] = request.rate_limit.limit
        resp.headers["X-Rate-Usage"] = usage

    generate_request_log(resp, took)
    if resp.is_streamed:
        # http://wiki.nginx.org/X-accel#X-Accel-Buffering
        resp.headers["X-Accel-Buffering"] = "no"

    if not hasattr(request, "_http_cache") or not request._http_cache:
        resp.cache_control.no_cache = True
        return resp

    if request.method != "GET" or resp.status_code != 200:
        resp.cache_control.no_cache = True
        return resp

    resp.cache_control.public = True
    resp.vary.add("Accept-Language")
    resp.vary.add("Authorization")

    if request._http_etag:
        resp.set_etag(request._http_etag)
        if request._http_revalidate:
            resp.cache_control.must_revalidate = request._http_revalidate
        else:
            resp.cache_control.max_age = 3600 * 12
    else:
        resp.expires = -1

    if request._http_private:
        resp.cache_control.public = None
        resp.cache_control.private = True
    return resp


def generate_request_log(resp, took):
    """Collect data about the request for analytical purposes."""
    # Move this down once we have multiple collectors.
    if settings.GOOGLE_REQUEST_LOGGING is False:
        return

    payload = {
        "v": __version__,
        "method": request.method,
        "endpoint": request.endpoint,
        "referrer": request.referrer,
        "ip": _get_remote_ip(),
        "ua": str(request.user_agent),
        "time": datetime.utcnow().isoformat(),
        "session_id": getattr(request, "_session_id", None),
        "locale": getattr(request, "_app_locale", None),
        "took": took,
        "url": request.url,
        "path": request.full_path,
        "status": resp.status_code,
    }
    if hasattr(request, "authz"):
        payload["role_id"] = request.authz.id
    tags = dict(request.view_args or ())
    if hasattr(request, "_log_tags"):
        tags.update(request._log_tags)
    for tag, value in tags.items():
        if value is not None and tag not in payload:
            payload[tag] = value

    # log.info("Log: %s", pformat(payload))
    if not hasattr(local, "_gcp_logger"):
        from google.cloud.logging import Client

        client = Client()
        logger_name = "%s-api" % settings.APP_NAME
        local._gcp_logger = client.logger(logger_name)
    local._gcp_logger.log_struct(payload)
