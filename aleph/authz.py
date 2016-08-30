from flask import request, current_app
from werkzeug.exceptions import Forbidden

from aleph.core import db
from aleph.model import Collection, Role, Permission

READ = 'read'
WRITE = 'write'
PUBLIC = 'public'


def get_public_roles():
    app = current_app._get_current_object()
    if not hasattr(app, '_public_roles') or not len(app._public_roles):
        roles = [
            Role.by_foreign_id(Role.SYSTEM_GUEST),
            Role.by_foreign_id(Role.SYSTEM_USER)
        ]
        app._public_roles = [r.id for r in roles if r is not None]
    return app._public_roles


def collections(action):
    """Pre-load collection authorisation info and cache the result.

    This is the core authorisation function, and is called at least once per
    request. It will query and cache the ID for all collections the current
    user is authorised to read or write.
    """
    if not hasattr(request, 'auth_collections'):
        public_roles = get_public_roles()
        request.auth_collections = {READ: set(), WRITE: set(), PUBLIC: set()}
        q = db.session.query(Permission.collection_id,
                             Permission.role_id,
                             Permission.read,
                             Permission.write)
        q = q.filter(Permission.deleted_at == None)  # noqa
        q = q.filter(Permission.role_id.in_(request.auth_roles))
        q = q.filter(Permission.collection_id != None)  # noqa
        for collection_id, role_id, read, write in q:
            if read or write:
                request.auth_collections[READ].add(collection_id)
                if role_id in public_roles:
                    request.auth_collections[PUBLIC].add(collection_id)
            if write and request.logged_in:
                request.auth_collections[WRITE].add(collection_id)
        if is_admin():
            q = Collection.all_ids().filter(Collection.deleted_at == None)  # noqa
            for collection_id, in q:
                request.auth_collections[READ].add(collection_id)
                request.auth_collections[WRITE].add(collection_id)
    return list(request.auth_collections.get(action, []))


def collection_read(coll):
    """Check if a given collection can be read."""
    return int(coll) in collections(READ)


def collection_write(coll):
    """Check if a given collection can be written."""
    return int(coll) in collections(WRITE)


def collection_public(coll):
    if isinstance(coll, Collection):
        coll = coll.id
    return int(coll) in collections(PUBLIC)


def collections_public(colls):
    return True in [collection_public(c) for c in colls]


def collections_intersect(action, colls, default_all=True):
    """Intersect the given and the available set of collections.

    This will return all available collections if the given set is empty
    and the ``default_all`` argument is ``True``.
    """
    available = collections(action)
    intersect = set()
    for collection_id in colls:
        try:
            if isinstance(collection_id, dict):
                collection_id = collection_id.get('id')
            collection_id = int(collection_id)
            if collection_id in available:
                intersect.add(collection_id)
        except:
            pass
    if not len(intersect) and default_all:
        return available
    return list(intersect)


def logged_in():
    return request.auth_role is not None


def is_admin():
    return logged_in() and request.auth_role.is_admin


def require(pred):
    if not pred:
        raise Forbidden("Sorry, you're not permitted to do this!")
