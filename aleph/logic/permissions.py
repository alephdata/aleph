import logging
from flask import render_template

from aleph.core import db, app_url, app_title
from aleph.notify import notify_role
from aleph.model import Permission

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write):
    """Update a roles permission to access a given collection."""
    pre = Permission.by_collection_role(collection.id, role)
    post = Permission.grant_collection(collection.id, role, read, write)
    db.session.commit()

    try:
        url = '%scollections/%s' % (app_url, collection.id)
        html = render_template('email/permission.html', role=role, url=url,
                               collection=collection, pre=pre, post=post,
                               app_url=app_url, app_title=app_title)
        notify_role(role, collection.label, html)
    except Exception as ex:
        log.exception(ex)
    return post
