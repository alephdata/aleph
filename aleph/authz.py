import json
import logging
from banal import ensure_list
from werkzeug.exceptions import Unauthorized

from aleph.core import db, cache, settings
from aleph.model import Collection, Role, Permission
from aleph.model.common import make_token

log = logging.getLogger(__name__)


class Authz(object):
    """Hold the authorization information for a user.

    This is usually attached to a request, but can also be used separately,
    e.g. in the context of notifications.
    """

    READ = "read"
    WRITE = "write"
    ACCESS = "authzca"
    TOKENS = "authztk"

    def __init__(self, role_id, roles, is_admin=False, token_id=None, expire=None):
        self.id = role_id
        self.logged_in = role_id is not None
        self.roles = set(roles)
        self.is_admin = is_admin
        self.token_id = token_id
        self.expire = expire or settings.SESSION_EXPIRE
        self.session_write = not settings.MAINTENANCE and self.logged_in
        self.can_browse_anonymous = not settings.REQUIRE_LOGGED_IN or self.logged_in
        self._collections = {}

    def collections(self, action):
        if self.is_admin:
            return [c for (c,) in Collection.all_ids()]

        if action in self._collections:
            return self._collections.get(action)
        key = self.id or "anonymous"
        collections = cache.kv.hget(self.ACCESS, key)
        if collections:
            self._collections = json.loads(collections)
        else:
            reads = set()
            writes = set()
            q = db.session.query(Permission)
            q = q.filter(Permission.role_id.in_(self.roles))
            for perm in q.all():
                if perm.read:
                    reads.add(perm.collection_id)
                if perm.write:
                    writes.add(perm.collection_id)
            self._collections = {self.READ: list(reads), self.WRITE: list(writes)}
            log.debug("Authz: %s: %r", self, self._collections)
            cache.kv.hset(self.ACCESS, key, json.dumps(self._collections))
        return self._collections.get(action, [])

    def can(self, collection, action):
        """Query permissions to see if the user can perform the specified
        action on the given collection."""
        if not self.can_browse_anonymous:
            return False
        if action == self.WRITE and not self.session_write:
            return False
        if self.is_admin:
            return True

        if isinstance(collection, Collection):
            collection = collection.id
        try:
            collection = int(collection)
        except (TypeError, ValueError):
            return False
        return collection in self.collections(action)

    def can_bulk_import(self):
        if not self.can_browse_anonymous or not self.session_write:
            return False
        return self.logged_in

    def can_write_role(self, role_id):
        if not self.can_browse_anonymous or not self.session_write:
            return False
        if self.is_admin:
            return True
        try:
            return int(role_id) in self.private_roles
        except (ValueError, TypeError):
            return False

    def can_read_role(self, role_id):
        if self.is_admin:
            return True
        return int(role_id) in self.roles

    def can_register(self):
        if self.logged_in or settings.MAINTENANCE or not settings.PASSWORD_LOGIN:
            return False
        return True

    def match(self, roles):
        """See if there's overlap in roles."""
        roles = ensure_list(roles)
        if not len(roles):
            return False
        return self.roles.intersection(roles) > 0

    def destroy(self):
        if self.role is not None:
            self.flush_role(self.role)
        if self.token_id is not None:
            cache.delete(cache.key(self.TOKENS, self.token_id))

    @property
    def role(self):
        if not hasattr(self, "_role"):
            self._role = Role.by_id(self.id)
        return self._role

    @property
    def private_roles(self):
        if not self.logged_in:
            return set()
        return self.roles.difference(Role.public_roles())

    def to_token(self):
        if self.token_id is None:
            self.token_id = "%s.%s" % (self.id, make_token())
            key = cache.key(self.TOKENS, self.token_id)
            state = {
                "id": self.id,
                "roles": list(self.roles),
                "is_admin": self.is_admin,
            }
            cache.set_complex(key, state, expires=self.expire)
        return self.token_id

    def __repr__(self):
        return "<Authz(%s)>" % self.id

    @classmethod
    def from_role(cls, role):
        roles = set([Role.load_id(Role.SYSTEM_GUEST)])
        if role is None or not role.is_actor:
            return cls(None, roles)

        roles.add(role.id)
        roles.add(Role.load_id(Role.SYSTEM_USER))
        roles.update([g.id for g in role.roles])
        return cls(role.id, roles, is_admin=role.is_admin)

    @classmethod
    def from_token(cls, token_id):
        state_key = cache.key(cls.TOKENS, token_id)
        state = cache.get_complex(state_key)
        if state is None:
            raise Unauthorized()
        return cls(
            state.get("id"),
            state.get("roles"),
            is_admin=state.get("is_admin"),
            token_id=token_id,
        )

    @classmethod
    def flush(cls):
        cache.kv.delete(cls.ACCESS)

    @classmethod
    def flush_role(cls, role):
        # Clear collections ACL cache.
        cache.kv.hdel(cls.ACCESS, role.id)
        if role.is_blocked or role.deleted_at is not None:
            # End all user sessions.
            prefix = cache.key(cls.TOKENS, "%s." % role.id)
            cache.flush(prefix=prefix)
