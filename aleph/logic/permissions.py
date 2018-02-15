import logging

from aleph.core import db
from aleph.model import Permission
from aleph.notify import notify_role_template
from aleph.logic.collections import collection_url

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write):
    """Update a roles permission to access a given collection."""
    pre = Permission.by_collection_role(collection, role)
    post = Permission.grant(collection, role, read, write)
    db.session.commit()

    notify_role_template(role, collection.label, 'email/permission.html',
                         url=collection_url(collection.id),
                         pre=pre,
                         post=post,
                         collection=collection)
    return post
