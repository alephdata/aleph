from flask import request
from werkzeug.exceptions import Forbidden

from aleph.core import db
from aleph.model import Source, Watchlist, Permission

READ = 'read'
WRITE = 'write'


def sources(action):
    if not hasattr(request, 'auth_sources'):
        request.auth_sources = {READ: set(), WRITE: set()}
        if is_admin():
            for source_id, in db.session.query(Source.id):
                request.auth_sources[READ].add(source_id)
                request.auth_sources[WRITE].add(source_id)
        else:
            q = db.session.query(Permission)
            q = q.filter(Permission.role_id.in_(request.auth_roles))
            q = q.filter(Permission.resource_type == Permission.SOURCE)
            for perm in q:
                if perm.read:
                    request.auth_sources[READ].add(perm.resource_id)
                if perm.write and request.logged_in:
                    request.auth_sources[WRITE].add(perm.resource_id)
    return list(request.auth_sources.get(action, []))


def watchlists(action):
    if not hasattr(request, 'auth_watchlists'):
        request.auth_watchlists = {READ: set(), WRITE: set()}
        if is_admin():
            for wl_id, in db.session.query(Watchlist.id):
                request.auth_watchlists[READ].add(wl_id)
                request.auth_watchlists[WRITE].add(wl_id)
        else:
            q = db.session.query(Permission)
            q = q.filter(Permission.role_id.in_(request.auth_roles))
            q = q.filter(Permission.resource_type == Permission.WATCHLIST)
            for perm in q:
                if perm.read:
                    request.auth_watchlists[READ].add(perm.resource_id)
                if perm.write and request.logged_in:
                    request.auth_watchlists[WRITE].add(perm.resource_id)
    return list(request.auth_watchlists.get(action, []))


def source_read(id):
    return int(id) in sources(READ)


def source_write(id):
    return int(id) in sources(WRITE)


def watchlist_read(id):
    return int(id) in watchlists(READ)


def watchlist_write(id):
    return int(id) in watchlists(WRITE)


def logged_in():
    return request.auth_role is not None


def is_admin():
    return logged_in() and request.auth_role.is_admin


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
