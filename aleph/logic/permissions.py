import logging

from aleph.core import db
from aleph.authz import Authz
from aleph.model import Permission, Events
from aleph.model import Notification, Role
from aleph.logic.notifications import publish
from aleph.logic.roles import refresh_role

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write, editor_id=None):
    """Update a roles permission to access a given collection."""
    pre = Permission.by_collection_role(collection, role)
    post = Permission.grant(collection, role, read, write)
    params = {'role': role, 'collection': collection}
    if (pre is None or not pre.read) and post.read:
        if role.foreign_id == Role.SYSTEM_GUEST:
            publish(Events.PUBLISH_COLLECTION,
                    actor_id=editor_id,
                    params=params,
                    channels=[Notification.GLOBAL])
        else:
            publish(Events.GRANT_COLLECTION,
                    actor_id=editor_id,
                    params=params,
                    channels=[role])
    db.session.commit()
    Authz.flush()
    refresh_role(role)
    return post
