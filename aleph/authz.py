from flask import request
from flask.ext.login import current_user
from werkzeug.exceptions import Forbidden

from aleph.model import Source, List


def authz_sources(action):
    if action == 'read' and request.authz_sources.get('read') is None:
        request.authz_sources['read'] = Source.list_user_slugs(current_user)
    if action == 'write' and request.authz_sources.get('write') is None:
        request.authz_sources['write'] = Source.list_user_slugs(current_user,
            include_public=False) # noqa
    return request.authz_sources[action] or []


def authz_lists(action):
    if action == 'read' and request.authz_lists.get('read') is None:
        request.authz_lists['read'] = List.user_list_ids(current_user)
    if action == 'write' and request.authz_lists.get('write') is None:
        request.authz_lists['write'] = List.user_list_ids(current_user,
            include_public=False) # noqa
    return request.authz_lists[action] or []


def source_read(name):
    return name in authz_sources('read')


def source_write(name):
    return name in authz_sources('write')


def list_read(id):
    return id in authz_lists('read')


def list_write(id):
    return id in authz_lists('write')


def logged_in():
    return current_user.is_authenticated()


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
