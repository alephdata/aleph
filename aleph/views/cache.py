from flask import request, Response, Blueprint
from apikit import cache_hash

from aleph.core import get_config


blueprint = Blueprint('cache', __name__)


class NotModified(Exception):
    pass


def handle_not_modified(exc):
    return Response(status=304)


@blueprint.before_app_request
def setup_caching():
    """Set some request attributes at the beginning of the request.

    By default, caching will be disabled."""
    request._http_cache = False
    request._http_etag = None
    request._http_private = False


def enable_cache(vary_user=True, vary=None, server_side=False):
    """Enable caching in the context of a view.

    If desired, instructions on the cache parameters can be included, such as
    if the data is fit for public caches (default: no, vary_user) and what
    values to include in the generation of an etag.
    """
    args = sorted(set(request.args.items()))
    # jquery where is your god now?!?
    args = filter(lambda (k, v): k != '_', args)

    cache_parts = [args, vary]

    if vary_user:
        cache_parts.extend((request.authz.roles))
        request._http_private = True

    request._http_cache = get_config('CACHE')
    request._http_etag = cache_hash(*cache_parts)

    if request.if_none_match == request._http_etag:
        raise NotModified()


@blueprint.after_app_request
def cache_response(resp):
    """Post-request processing to set cache parameters."""
    if request.endpoint == 'static':
        enable_cache()
        request._http_cache = True
        # resp.set_etag(request._http_etag)
        resp.cache_control.public = True
        resp.cache_control.max_age = 3600 * 24 * 14
        return resp

    if resp.is_streamed:
        # http://wiki.nginx.org/X-accel#X-Accel-Buffering
        resp.headers['X-Accel-Buffering'] = 'no'

    if not request._http_cache:
        return resp

    if request.method not in ['GET', 'HEAD', 'OPTIONS']:
        return resp

    if resp.status_code != 200:
        return resp

    if request._http_etag:
        if request.if_none_match == request._http_etag:
            raise NotModified()

        resp.set_etag(request._http_etag)

    if request._http_private:
        resp.cache_control.private = True
        resp.expires = -1
    else:
        resp.cache_control.public = True
        resp.cache_control.max_age = 3600 * 12
    return resp
