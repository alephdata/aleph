from flask import request, Response, Blueprint
from apikit import cache_hash

from aleph.core import get_config


blueprint = Blueprint('cache_api', __name__)


class NotModified(Exception):
    pass


def handle_not_modified(exc):
    return Response(status=304)


@blueprint.before_app_request
def setup_caching():
    request._http_cache = False
    request._http_etag = None
    request._http_server = True


def enable_cache(vary_user=False, vary=None, server_side=True):
    args = sorted(set(request.args.items()))
    # jquery where is your god now?!?
    args = filter(lambda (k, v): k != '_', args)

    cache_parts = [args, vary]

    if vary_user:
        cache_parts.extend((request.authz.roles))

    request._http_cache = get_config('CACHE')
    request._http_etag = cache_hash(*cache_parts)
    request._http_server = server_side

    if request.if_none_match == request._http_etag:
        raise NotModified()


@blueprint.after_app_request
def cache_response(resp):
    if request.endpoint == 'static':
        enable_cache()
        request._http_cache = True
        resp.set_etag(request._http_etag)
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

    if request.authz.logged_in:
        resp.cache_control.private = True
    else:
        resp.cache_control.public = True

    if request._http_server:
        resp.expires = -1
    else:
        resp.cache_control.max_age = 3600 * 2
    return resp
