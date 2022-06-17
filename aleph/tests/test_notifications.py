# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from aleph.core import db, mail
from aleph.model import Events
from aleph.logic.notifications import publish, generate_digest
from aleph.logic.notifications import GLOBAL, get_notifications
from aleph.logic.roles import update_role
from aleph.tests.util import TestCase


class NotificationsTestCase(TestCase):
    def setUp(self):
        super(NotificationsTestCase, self).setUp()

    def test_publish_event(self):
        role = self.create_user()
        email = "test@aleph.skynet"
        label = "So public"
        recipient = self.create_user(foreign_id="rolex", email=email)
        update_role(recipient)
        collection = self.create_collection(foreign_id="NoNoNo", label=label)
        event = Events.PUBLISH_COLLECTION
        publish(event, role.id, params={"collection": collection}, channels=[GLOBAL])
        db.session.commit()

        result = get_notifications(recipient)
        notifications = result.get("hits", {})
        assert 1 == notifications["total"]["value"], notifications
        not0 = notifications["hits"][0]["_source"]
        assert not0["event"] == event.name, not0["event"]
        params = not0["params"]
        assert params["collection"] == str(collection.id), params

        with mail.record_messages() as outbox:
            assert len(outbox) == 0, outbox
            generate_digest()
            assert len(outbox) == 1, outbox
            msg = outbox[0]
            assert email in msg.recipients, msg.recipients
            assert label in msg.html, msg.html
