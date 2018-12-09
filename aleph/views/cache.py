import logging
from banal import hash_data
from flask_babel import get_locale
from flask import request, Response, Blueprint

from aleph.core import settings
from aleph.util import trace_function

log = logging.getLogger(__name__)
blueprint = Blueprint('cache', __name__)


class NotModified(Exception):
    """Converts to HTTP status 304."""
    pass


def handle_not_modified(exc):
    return Response(status=304)


@blueprint.before_app_request
def setup_caching():
    """Set some request attributes at the beginning of the request.
    By default, caching will be disabled."""
    locale = get_locale()
    request._app_locale = str(locale)

    request.session_id = request.headers.get('X-Aleph-Session')
    if request.session_id is None:
        request.session_id = hash_data((request.remote_addr,
                                        request.accept_languages,
                                        request.user_agent))

    request._http_cache = False
    request._http_private = False
    request._http_revalidate = False
    request._http_etag = None


@trace_function(span_name="ENABLE_CACHE")
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


@blueprint.after_app_request
def cache_response(resp):
    """Post-request processing to set cache parameters."""
    resp.headers['X-Aleph-Session'] = request.session_id
    if resp.is_streamed:
        # http://wiki.nginx.org/X-accel#X-Accel-Buffering
        resp.headers['X-Accel-Buffering'] = 'no'

    if not request._http_cache:
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
