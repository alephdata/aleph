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

    READ = "read"
    WRITE = "write"
    PREFIX = "aauthz"

    def __init__(self, role_id, roles, is_admin=False, expire=None):
        self.id = role_id
        self.logged_in = role_id is not None
        self.roles = set(ensure_list(roles))
        self.is_admin = is_admin
        self.session_write = not settings.MAINTENANCE and self.logged_in
        self._collections = {}

        if expire is None:
            expire = datetime.utcnow() + timedelta(days=1)
        self.expire = expire

    def collections(self, action):
        if self.is_admin:
            return [c for (c,) in Collection.all_ids()]

        if action in self._collections:
            return self._collections.get(action)
        collections = cache.kv.hget(self.PREFIX, self.id)
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
            cache.kv.hset(self.PREFIX, self.id, json.dumps(self._collections))
        return self._collections.get(action, [])

    def can(self, collection, action):
        """Query permissions to see if the user can perform the specified
        action on the given collection."""
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
        if not self.session_write:
            return False
        return self.logged_in

    def can_write_role(self, role_id):
        if not self.session_write:
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

    @property
    def role(self):
        return Role.by_id(self.id)

    @property
    def private_roles(self):
        if not self.logged_in:
            return set()
        return self.roles.difference(Role.public_roles())

    def to_token(self, scope=None, role=None, expire=None):
        payload = {
            "u": self.id,
            "exp": expire or self.expire,
            "r": list(self.roles),
            "a": self.is_admin,
        }
        if scope is not None:
            payload["s"] = scope
        if role is not None:
            role = role.to_dict()
            role.pop("created_at", None)
            role.pop("updated_at", None)
            payload["role"] = role
        return jwt.encode(payload, settings.SECRET_KEY)

    def __repr__(self):
        return "<Authz(%s)>" % self.id

    @classmethod
    def from_role(cls, role):
        roles = set([Role.load_id(Role.SYSTEM_GUEST)])
        if role is None or role.is_blocked:
            return cls(None, roles)

        roles.add(role.id)
        roles.add(Role.load_id(Role.SYSTEM_USER))
        roles.update([g.id for g in role.roles])
        return cls(role.id, roles, is_admin=role.is_admin)

    @classmethod
    def from_token(cls, token, scope=None):
        if token is None:
            return
        try:
            data = jwt.decode(token, key=settings.SECRET_KEY, verify=True)
            if "s" in data and data.get("s") != scope:
                raise Unauthorized()
            expire = datetime.utcfromtimestamp(data["exp"])
            return cls(
                data.get("u"),
                data.get("r"),
                expire=expire,
                is_admin=data.get("a", False),
            )
        except (jwt.DecodeError, TypeError):
            return

    @classmethod
    def flush(cls):
        cache.kv.delete(cls.PREFIX)

    @classmethod
    def flush_role(cls, role_id):
        cache.kv.hdel(cls.PREFIX, role_id)
