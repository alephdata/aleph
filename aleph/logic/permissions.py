# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

import logging

from aleph.core import db
from aleph.model import Permission, Events, Role
from aleph.logic.notifications import GLOBAL, publish
from aleph.logic.roles import refresh_role

log = logging.getLogger(__name__)


def update_permission(role, collection, read, write, editor_id=None):
    """Update a roles permission to access a given collection."""
    pre = Permission.by_collection_role(collection, role)
    post = Permission.grant(collection, role, read, write)
    db.session.flush()
    refresh_role(role)
    if post is None:
        return
    params = {"role": role, "collection": collection}
    if pre is None or not pre.read:
        if role.foreign_id == Role.SYSTEM_GUEST:
            publish(
                Events.PUBLISH_COLLECTION,
                actor_id=editor_id,
                params=params,
                channels=[GLOBAL],
            )
        else:
            publish(
                Events.GRANT_COLLECTION,
                actor_id=editor_id,
                params=params,
                channels=[role],
            )
    return post
