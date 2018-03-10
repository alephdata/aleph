import logging

from aleph.core import db
from aleph.model import Permission, Events, Notification
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write, editor=None):
    """Update a roles permission to access a given collection."""
    pre = Permission.by_collection_role(collection, role)
    post = Permission.grant(collection, role, read, write)
    params = {'role': role, 'collection': collection}
    if pre.read != post.read and post.read:
        if role.is_public:
            publish(Events.PUBLISH_COLLECTION,
                    actor_id=editor.id,
                    params=params,
                    channels=[Notification.GLOBAL])
        else:
            publish(Events.GRANT_COLLECTION,
                    actor_id=editor.id,
                    params=params)
    elif pre.read != post.read and pre.read:
        publish(Events.REVOKE_COLLECTION,
                actor_id=editor.id,
                params=params)
    db.session.commit()
    return post
