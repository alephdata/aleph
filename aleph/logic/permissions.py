import logging

from aleph.core import db, app_url
from aleph.notify import notify_role_template
from aleph.index.collections import update_roles, index_collection
from aleph.model import Permission

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write):
    """Update a roles permission to access a given collection."""
    pre = Permission.by_collection_role(collection.id, role)
    post = Permission.grant(collection.id, role, read, write)
    db.session.commit()
    update_roles(collection)
    index_collection(collection)

    notify_role_template(role, collection.label, 'email/permission.html',
                         url='%scollections/%s' % (app_url, collection.id),
                         pre=pre,
                         post=post,
                         collection=collection)
    return post
