from flask import request
from flask.ext.login import current_user
from werkzeug.exceptions import Forbidden

from aleph.core import db
from aleph.model import Source, List, User

READ = 'read'
WRITE = 'write'


def sources(action):
    request._authz_sources = {READ: set(), WRITE: set()}
    q = db.session.query(Source.id).filter_by(public=True)
    for source_id, in q.all():
        request._authz_sources[READ].add(source_id)
    if logged_in():
        q = db.session.query(Source.id)
        if not is_admin():
            q = q.filter(Source.users.any(User.id == current_user.id))
        for source_id, in q.all():
            request._authz_sources[READ].add(source_id)
            request._authz_sources[WRITE].add(source_id)
    return list(request._authz_sources.get(action, []))


def lists(action):
    request._authz_lists = {READ: set(), WRITE: set()}
    q = db.session.query(List.id).filter_by(public=True)
    for list_id, in q.all():
        request._authz_lists[READ].add(list_id)
    if logged_in():
        q = db.session.query(List.id)
        if not is_admin():
            q = q.filter(List.users.any(User.id == current_user.id))
        for list_id, in q.all():
            request._authz_lists[READ].add(list_id)
            request._authz_lists[WRITE].add(list_id)
    return list(request._authz_lists.get(action, []))


def source_read(id):
    return int(id) in sources(READ)


def source_write(id):
    return int(id) in sources(WRITE)


def list_read(id):
    return int(id) in lists(READ)


def list_write(id):
    return int(id) in lists(WRITE)


def logged_in():
    return current_user.is_authenticated()


def is_admin():
    return logged_in() and current_user.is_admin


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
