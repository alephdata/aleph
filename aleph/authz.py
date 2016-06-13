from flask import request
from werkzeug.exceptions import Forbidden

from aleph.model import Collection, Permission

READ = 'read'
WRITE = 'write'


def collections(action):
    if not hasattr(request, 'auth_collections'):
        request.auth_collections = {READ: set(), WRITE: set()}
        if is_admin():
            q = Collection.all_ids().filter(Collection.deleted_at == None)  # noqa
            for col_id, in q:
                request.auth_collections[READ].add(col_id)
                request.auth_collections[WRITE].add(col_id)
        else:
            q = Permission.all()
            q = q.filter(Permission.role_id.in_(request.auth_roles))
            for perm in q:
                if perm.read:
                    request.auth_collections[READ].add(perm.collection_id)
                if perm.write and request.logged_in:
                    request.auth_collections[WRITE].add(perm.collection_id)
    return list(request.auth_collections.get(action, []))


def collection_read(id):
    return int(id) in collections(READ)


def collection_write(id):
    return int(id) in collections(WRITE)


def logged_in():
    return request.auth_role is not None


def is_admin():
    return logged_in() and request.auth_role.is_admin


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
