from werkzeug.exceptions import Forbidden

from aleph.core import db, get_config
from aleph.model import Collection, Role, Permission
from aleph.util import ensure_list


def get_public_roles():
    """Roles which make a collection to be considered public."""
    return [
        Role.load_id(Role.SYSTEM_GUEST),
        Role.load_id(Role.SYSTEM_USER),
    ]


class Authz(object):
    """Hold the authorization information for a user.

    This is usually attached to a request, but can also be used separately,
    e.g. in the context of notifications.
    """
    READ = 'read'
    WRITE = 'write'
    PUBLIC = 'public'

    def __init__(self, role=None, override=False):
        self.roles = set([Role.load_id(Role.SYSTEM_GUEST)])
        self.role = role
        self.logged_in = role is not None
        self.override = self.is_admin = override
        self.in_maintenance = get_config('MAINTENANCE')

        if self.logged_in:
            self.is_admin = role.is_admin
            self.roles.add(role.id)
            self.roles.add(Role.load_id(Role.SYSTEM_USER))
            for group in role.roles:
                self.roles.add(group.id)

        # Pre-load collection authorisation info and cache the result.
        # This is the core authorisation function, and is called at least once
        # per request. It will query and cache the ID for all collections the
        # current user is authorised to read or write.
        self.collections = {
            self.READ: set(),
            self.WRITE: set(),
            self.PUBLIC: set()
        }
        q = db.session.query(Permission.collection_id,
                             Permission.role_id,
                             Permission.read,
                             Permission.write)
        q = q.filter(Permission.deleted_at == None)  # noqa
        q = q.filter(Permission.role_id.in_(self.roles))
        q = q.filter(Permission.collection_id != None)  # noqa
        for collection_id, role_id, read, write in q:
            if read or write:
                self.collections[self.READ].add(collection_id)
                if role_id in get_public_roles():
                    self.collections[self.PUBLIC].add(collection_id)
            if write and self.logged_in:
                self.collections[self.WRITE].add(collection_id)
        if self.is_admin:
            q = Collection.all_ids().filter(Collection.deleted_at == None)  # noqa
            for collection_id, in q:
                self.collections[self.READ].add(collection_id)
                self.collections[self.WRITE].add(collection_id)

        # Disable all in maintenance mode.
        if self.in_maintenance:
            self.collections[self.WRITE] = set()

        self.collections_read = list(self.collections[self.READ])
        self.collections_write = list(self.collections[self.WRITE])

    def _collection_check(self, collection, action):
        if isinstance(collection, Collection):
            collection = collection.id
        try:
            return int(collection) in self.collections.get(action)
        except:
            return False

    def collection_read(self, collection):
        """Check if a given collection can be read."""
        return self._collection_check(collection, self.READ)

    def collection_write(self, collection):
        """Check if a given collection can be written."""
        return self._collection_check(collection, self.WRITE)

    def collection_public(self, collection):
        return self._collection_check(collection, self.PUBLIC)

    def collections_intersect(self, action, colls, default_all=True):
        """Intersect the given and the available set of collections.

        This will return all available collections if the given set is empty
        and the ``default_all`` argument is ``True``.
        """
        available = self.collections.get(action)
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

    def session_write(self):
        if self.in_maintenance:
            return False
        return self.logged_in

    def check_roles(self, roles):
        # if self.in_maintenance:
        #     return False
        if self.is_admin:
            return True
        isect = self.roles.intersection(ensure_list(roles))
        return len(isect) > 0

    def require(self, pred):
        if not pred:
            raise Forbidden("Sorry, you're not permitted to do this!")

    def __repr__(self):
        return '<Authz(%s)>' % self.role
