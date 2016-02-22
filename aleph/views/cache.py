from flask import request, Response
from apikit import cache_hash

from aleph.core import app
from aleph import authz


class NotModified(Exception):
    pass


def handle_not_modified(exc):
    return Response(status=304)


@app.before_request
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
        cache_parts.extend((request.auth_roles))

    request._http_cache = app.config.get('CACHE')
    request._http_etag = cache_hash(*cache_parts)
    request._http_server = server_side

    if request.if_none_match == request._http_etag:
        raise NotModified()


@app.after_request
def cache_response(resp):
    if resp.is_streamed and request.endpoint != 'static':
        # http://wiki.nginx.org/X-accel#X-Accel-Buffering
        resp.headers['X-Accel-Buffering'] = 'no'
        # resp.cache_control.no_cache = True
        return resp

    if request.endpoint == 'static':
        enable_cache()
        request._http_cache = True
        resp.set_etag(request._http_etag)
        resp.cache_control.public = True
        resp.cache_control.max_age = 3600 * 24 * 14
        return resp

    if not request._http_cache \
            or request.method not in ['GET', 'HEAD', 'OPTIONS'] \
            or resp.status_code > 399:
        resp.cache_control.no_cache = True
        return resp

    if request._http_server:
        resp.cache_control.must_revalidate = True
        resp.cache_control.private = True
        resp.expires = -1
    else:
        resp.cache_control.private = True
        resp.cache_control.max_age = 3600 * 2

    if not authz.logged_in():
        resp.cache_control.public = True

    if request._http_etag:
        resp.set_etag(request._http_etag)

    return resp
