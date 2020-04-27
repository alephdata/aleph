import time
import logging
from pprint import pformat  # noqa
from banal import hash_data
from datetime import datetime
from flask_babel import get_locale
from flask import request, Response, Blueprint

from aleph import signals, __version__
from aleph.core import settings

log = logging.getLogger(__name__)
blueprint = Blueprint('cache', __name__)


class NotModified(Exception):
    """Converts to HTTP status 304."""
    pass


def handle_not_modified(exc):
    return Response(status=304)


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


def tag_request(**kwargs):
    """Store metadata for structured log output."""
    for tag, value in kwargs.items():
        if value is not None:
            request._log_tags[tag] = value


@blueprint.before_app_request
def setup_request():
    """Set some request attributes at the beginning of the request.
    By default, caching will be disabled."""
    request._begin_time = time.time()
    request._app_locale = str(get_locale())
    request._session_id = request.headers.get('X-Aleph-Session')
    request._http_cache = False
    request._http_private = False
    request._http_revalidate = False
    request._http_etag = None
    request._log_tags = {}


@blueprint.after_app_request
def finalize_response(resp):
    """Post-request processing to set cache parameters."""
    generate_request_log(resp)
    if resp.is_streamed:
        # http://wiki.nginx.org/X-accel#X-Accel-Buffering
        resp.headers['X-Accel-Buffering'] = 'no'

    if not hasattr(request, '_http_cache') or not request._http_cache:
        resp.cache_control.no_cache = True
        return resp

    if request.method != 'GET' or resp.status_code != 200:
        resp.cache_control.no_cache = True
        return resp

    resp.cache_control.public = True
    resp.vary.add('Accept-Language')
    resp.vary.add('Authorization')

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


def get_remote_ip():
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0]
    else:
        return request.remote_addr


def generate_request_log(resp):
    """Collect data about the request for analytical purposes."""
    log.info("HEADERS: %s", list(request.headers.items()))
    log.info("REMOTE: %s", get_remote_ip())
    payload = {
        'v': __version__,
        'method': request.method,
        'endpoint': request.endpoint,
        'referrer': request.referrer,
        'ip': get_remote_ip(),
        'ua': str(request.user_agent),
        'time': datetime.utcnow().isoformat(),
        'url': request.url,
        'path': request.full_path,
        'status': resp.status_code
    }
    if hasattr(request, '_session_id'):
        payload['session_id'] = request._session_id
    if hasattr(request, 'authz'):
        payload['role_id'] = request.authz.id
    if hasattr(request, '_begin_time'):
        took = time.time() - request._begin_time
        payload['took'] = int(took * 1000)
    if hasattr(request, '_app_locale'):
        payload['locale'] = request._app_locale
    tags = dict(request.view_args or ())
    if hasattr(request, '_log_tags'):
        tags.update(request._log_tags)
    for tag, value in tags.items():
        if value is not None and tag not in payload:
            payload[tag] = value

    # log.info("Log: %s", pformat(payload))
    signals.handle_request_log.send(payload=payload)
