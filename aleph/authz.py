import jwt
import json
import logging
from banal import ensure_list
from datetime import datetime, timedelta
from werkzeug.exceptions import Unauthorized

from aleph.core import db, cache, settings
from aleph.model import Collection, Role, Permission

log = logging.getLogger(__name__)


class Authz(object):
    """Hold the authorization information for a user.

    This is usually attached to a request, but can also be used separately,
    e.g. in the context of notifications.
    """
    READ = 'read'
    WRITE = 'write'
    PREFIX = 'aauthz'

    def __init__(self, role_id, roles, is_admin=False):
        self.id = role_id
        self.logged_in = role_id is not None
        self.roles = set(ensure_list(roles))
        self.is_admin = is_admin
        self.in_maintenance = settings.MAINTENANCE
        self.session_write = not self.in_maintenance and self.logged_in
        self._collections = {}

    def collections(self, action):
        if action in self._collections:
            return self._collections.get(action)
        key = cache.key(action, self.id)
        collections = cache.kv.hget(self.PREFIX, key)
        if collections:
            collections = json.loads(collections)
            self._collections[action] = collections
            log.debug("[C] Authz: %s (%s): %d collections",
                      self, action, len(collections))
            return collections

        if self.is_admin:
            q = Collection.all_ids()
        else:
            q = db.session.query(Permission.collection_id)
            q = q.filter(Permission.deleted_at == None)  # noqa
            q = q.filter(Permission.role_id.in_(self.roles))
            if action == self.READ:
                q = q.filter(Permission.read == True)  # noqa
            if action == self.WRITE:
                q = q.filter(Permission.write == True)  # noqa
            q = q.distinct()
            # log.info("Query: %s - roles: %s", q, self.roles)
        collections = [c for (c,) in q.all()]
        log.debug("Authz: %s (%s): %d collections",
                  self, action, len(collections))
        cache.kv.hset(self.PREFIX, key, json.dumps(collections))
        self._collections[action] = collections
        return collections

    def can(self, collection, action):
        """Query permissions to see if the user can perform the specified
        action on the given collection."""
        if action == self.WRITE and not self.session_write:
            return False
        if self.is_admin:
            return True

        if isinstance(collection, Collection):
            collection = collection.id
        if collection is None:
            return False

        try:
            collection = int(collection)
        except ValueError:
            return False
        return collection in self.collections(action)

    def can_stream(self):
        return self.logged_in

    def can_bulk_import(self):
        if not self.session_write:
            return False
        return self.logged_in

    def can_write_role(self, role_id):
        if not self.session_write or role_id is None:
            return False
        # if self.is_admin:
        #     return True
        return self.id == int(role_id)

    def can_read_role(self, role_id):
        if self.is_admin:
            return True
        return int(role_id) in self.roles

    def match(self, roles):
        """See if there's overlap in roles."""
        roles = ensure_list(roles)
        if not len(roles):
            return False
        return self.roles.intersection(roles) > 0

    @property
    def role(self):
        return Role.by_id(self.id)

    def to_token(self, scope=None, role=None):
        exp = datetime.utcnow() + timedelta(days=1)
        payload = {
            'u': self.id,
            'exp': exp,
            'r': list(self.roles),
            'a': self.is_admin,
        }
        if scope is not None:
            payload['s'] = scope
        if role is not None:
            role = role.to_dict()
            role.pop('created_at', None)
            role.pop('updated_at', None)
            payload['role'] = role
        return jwt.encode(payload, settings.SECRET_KEY)

    def __repr__(self):
        return '<Authz(%s)>' % self.id

    @classmethod
    def from_role(cls, role):
        roles = set([Role.load_id(Role.SYSTEM_GUEST)])
        if role is None:
            return cls(None, roles)

        roles.add(role.id)
        if not role.is_blocked:
            roles.add(Role.load_id(Role.SYSTEM_USER))
            roles.update([g.id for g in role.roles])
        return cls(role.id, roles, is_admin=role.is_admin)

    @classmethod
    def from_token(cls, token, scope=None):
        if token is None:
            return
        try:
            data = jwt.decode(token, key=settings.SECRET_KEY, verify=True)
            if 's' in data and data.get('s') != scope:
                raise Unauthorized()
            return cls(data.get('u'),
                       data.get('r'),
                       data.get('a', False))
        except (jwt.DecodeError, TypeError):
            return

    @classmethod
    def flush(cls):
        cache.kv.delete(cls.PREFIX)

    @classmethod
    def flush_role(cls, role_id):
        keys = [cache.key(a, role_id) for a in (cls.READ, cls.WRITE)]
        cache.kv.hdel(cls.PREFIX, *keys)
