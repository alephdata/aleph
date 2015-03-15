from flask import request, Response, get_flashed_messages
from flask.ext.login import current_user
from apikit import cache_hash

from aleph.core import app


class NotModified(Exception):
    pass


def handle_not_modified(exc):
    return Response(status=304)


@app.before_request
def setup_caching():
    request._http_cache = app.config.get('CACHE')
    request._http_etag = None


def disable_cache():
    request._http_cache = False


@app.after_request
def cache_response(resp):
    if resp.is_streamed and request.endpoint != 'static':
        # http://wiki.nginx.org/X-accel#X-Accel-Buffering
        resp.headers['X-Accel-Buffering'] = 'no'

    if not request._http_cache \
            or request.method not in ['GET', 'HEAD', 'OPTIONS'] \
            or resp.status_code > 399 \
            or resp.is_streamed \
            or len(get_flashed_messages()):
        resp.cache_control.no_cache = True
        return resp

    resp.cache_control.max_age = 3600 * 3

    if current_user.is_authenticated():
        resp.cache_control.private = True
    else:
        resp.cache_control.public = True
    if request._http_etag is None:
        etag_cache_keygen()
    resp.set_etag(request._http_etag)
    return resp


def etag_cache_keygen(*keys):
    if not request._http_cache:
        return

    args = sorted(set(request.args.items()))
    # jquery where is your god now?!?
    args = filter(lambda (k, v): k != '_', args)

    cache_parts = [args, keys]
    if current_user.is_authenticated():
        cache_parts.extend((current_user,
                            request.authz_sources,
                            request.authz_lists))
    request._http_etag = cache_hash(*cache_parts)
    if request.if_none_match == request._http_etag:
        raise NotModified()
