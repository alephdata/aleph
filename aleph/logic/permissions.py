import logging

from aleph.core import db
from aleph.notify import notify_role_template
from aleph.index.collections import update_roles, index_collection
from aleph.model import Permission

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write):
    """Update a roles permission to access a given collection."""
    from aleph.logic.collections import collection_url
    pre = Permission.by_collection_role(collection, role)
    post = Permission.grant(collection, role, read, write)
    db.session.commit()
    update_roles(collection)
    index_collection(collection)

    notify_role_template(role, collection.label, 'email/permission.html',
                         url=collection_url(collection.id),
                         pre=pre,
                         post=post,
                         collection=collection)
    return post
