from dataclasses import dataclass, asdict
from enum import Enum
from typing import List, Set, Dict, Optional, Union
import pydantic

import jwt
import json
import logging
from datetime import datetime, timedelta
from werkzeug.exceptions import Unauthorized

from aleph.core import db, cache, settings
from aleph.model import Collection, Role, Permission

log = logging.getLogger(__name__)


class ActionEnum(str, Enum):
    READ = "read"
    WRITE = "write"


class Authz:
    """Hold the authorization information for a user.

    This is usually attached to a request, but can also be used separately,
    e.g. in the context of notifications.
    """

    PREFIX = "aauthz"

    _JWT_TOKENS_VALIDITY_DURATION = timedelta(days=1)
    _JWT_TOKENS_ALGORITHM = "HS256"

    def __init__(self, role_id: Optional[int], roles: Set[int], is_admin: bool = False, is_blocked: bool = False):
        self.id = role_id
        self.logged_in = role_id is not None
        self.roles = roles
        self.is_admin = is_admin
        self.is_blocked = is_blocked
        self.in_maintenance = settings.MAINTENANCE
        self.session_write = not self.in_maintenance and self.logged_in
        self.session_write = not is_blocked and self.session_write
        self._collections: Dict[ActionEnum, List[Collection]] = {}

    def collections(self, action: ActionEnum) -> List[Collection]:
        if action in self._collections:
            return self._collections[action]
        key = cache.key(action, self.id)
        collections = cache.kv.hget(self.PREFIX, key)
        if collections:
            collections = json.loads(collections)
            self._collections[action] = collections
            log.debug("[C] Authz: %s (%s): %d collections", self, action, len(collections))
            return collections

        if self.is_admin:
            q = Collection.all_ids()
        else:
            q = db.session.query(Permission.collection_id)
            q = q.filter(Permission.role_id.in_(self.roles))
            if action == ActionEnum.READ:
                q = q.filter(Permission.read == True)  # noqa
            if action == ActionEnum.WRITE:
                q = q.filter(Permission.write == True)  # noqa
            q = q.distinct()
            # log.info("Query: %s - roles: %s", q, self.roles)
        collections = [c for (c,) in q.all()]
        log.debug("Authz: %s (%s): %d collections", self, action, len(collections))
        cache.kv.hset(self.PREFIX, key, json.dumps(collections))
        self._collections[action] = collections
        return collections

    def can(self, collection, action: ActionEnum) -> bool:
        """Query permissions to see if the user can perform the specified
        action on the given collection."""
        if action == ActionEnum.WRITE and not self.session_write:
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

    def can_stream(self) -> bool:
        return self.logged_in

    def can_bulk_import(self) -> bool:
        if not self.session_write:
            return False
        return self.logged_in

    def can_write_role(self, role_id: Union[int, str]) -> bool:
        if not self.session_write:
            return False
        if self.is_admin:
            return True
        return int(role_id) in self.private_roles

    def can_read_role(self, role_id: Union[int, str]) -> bool:
        if self.is_admin:
            return True
        return int(role_id) in self.roles

    @property
    def role(self) -> Role:
        return Role.by_id(self.id)

    @property
    def private_roles(self) -> Set[int]:
        if not self.logged_in:
            return set()
        return self.roles.difference(Role.public_roles())

    def to_token(self, scope: Optional[str] = None) -> str:
        token = _JtwToken(
            u=self.id,
            exp=datetime.utcnow() + self._JWT_TOKENS_VALIDITY_DURATION,
            r=self.roles,
            a=self.is_admin,
            b=self.is_blocked,
            s=scope,
            role=self.role.to_dict(),
        )
        return token.to_str()

    @classmethod
    def from_token(cls, jwt_token: str, request_path: str) -> "Authz":
        parsed_token = _JtwToken.from_str(jwt_token)
        if parsed_token.s and parsed_token.s != request_path:
            raise Unauthorized()

        # TODO(AD): is_admin and is_blocked are already in the DB so it seems dangerous to take them from a JWT token
        return cls(
            role_id=parsed_token.u, roles=set(parsed_token.r), is_admin=parsed_token.a, is_blocked=parsed_token.b,
        )

    def __repr__(self) -> str:
        return "<Authz(%s)>" % self.id

    @classmethod
    def from_role(cls, role: Optional[Role]) -> "Authz":
        roles = set([Role.load_id(Role.SYSTEM_GUEST)])
        if role is None:
            return cls(None, roles)

        roles.add(role.id)
        if not role.is_blocked:
            roles.add(Role.load_id(Role.SYSTEM_USER))
            roles.update([g.id for g in role.roles])
        return cls(role.id, roles, is_admin=role.is_admin, is_blocked=role.is_blocked)

    @classmethod
    def flush(cls) -> None:
        cache.kv.delete(cls.PREFIX)

    @classmethod
    def flush_role(cls, role_id) -> None:
        keys = [cache.key(a, role_id) for a in ActionEnum]
        cache.kv.hdel(cls.PREFIX, *keys)


class InvalidJwtToken(Exception):
    pass


class _RoleField(pydantic.BaseModel):
    id: int
    type: str
    name: str
    label: str
    email: Optional[str]
    locale: Optional[str]
    is_admin: bool
    is_muted: bool
    is_tester: bool
    has_password: bool


class _JtwToken(pydantic.BaseModel):
    u: int  # role ID
    r: List[int]  # role IDs  # TODO(AD): Is this required or optional?
    exp: datetime  # Expiration date; automatically checked by the JWT library but ONLY if present here
    a: bool = False  # is_admin
    b: bool = False  # is_blocked
    s: Optional[str] = None  # Scope ie. request path the token is valid for; None means all paths are authorized
    role: _RoleField

    @classmethod
    def from_str(cls, token_as_str: str) -> "_JtwToken":
        # First validate the token's signature and extract its payload
        try:
            token_as_dict = jwt.decode(
                jwt=token_as_str, key=settings.SECRET_KEY, verify=True, algorithms=[Authz._JWT_TOKENS_ALGORITHM]
            )
        except jwt.InvalidTokenError as e:
            logging.warning(e, exc_info=True)
            raise InvalidJwtToken()

        # Then validate the content of the payload
        try:
            token = cls(**token_as_dict)
        except pydantic.ValidationError as e:
            logging.warning(e, exc_info=True)
            raise InvalidJwtToken()

        return token

    def to_str(self) -> str:
        token_as_dict = self.dict(exclude_none=True)
        return jwt.encode(payload=token_as_dict, key=settings.SECRET_KEY, algorithm=Authz._JWT_TOKENS_ALGORITHM).decode(
            "utf-8"
        )
