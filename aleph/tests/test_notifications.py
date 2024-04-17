import datetime

from lxml.html import document_fromstring

from aleph.core import db, mail
from aleph.model import Events
from aleph.logic.notifications import publish, generate_digest, render_notification
from aleph.logic.notifications import GLOBAL, get_notifications
from aleph.logic.roles import update_role
from aleph.tests.util import TestCase


class NotificationsTestCase(TestCase):
    def setUp(self):
        super(NotificationsTestCase, self).setUp()

    def get_indexed_notification(self, role, event, params):
        return {
            "_source": {
                "actor_id": role.id,
                "params": params,
                "event": event.name,
                "channels": [],
                "created_at": datetime.datetime.now(datetime.timezone.utc),
            },
        }

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

    def test_render_notification(self):
        role = self.create_user(name="John Doe", email="john.doe@example.org")
        label = "My collection"
        collection = self.create_collection(label=label)
        db.session.commit()
        update_role(role)

        data = self.get_indexed_notification(
            role=role,
            event=Events.CREATE_COLLECTION,
            params={"collection": collection.id},
        )

        rendered = render_notification(role, data)
        assert rendered is not None

        plain = rendered["plain"]
        html = rendered["html"]
        assert (
            plain
            == "'John Doe <j*******@example.org>' created 'My collection' (http://aleph.ui/datasets/1)"
        )
        assert (
            html
            == "<span class='reference'>John Doe &lt;j*******@example.org&gt;</span> created <a class='reference' href='http://aleph.ui/datasets/1'>My collection</a>"
        )

    def test_render_notification_link_reference(self):
        role = self.create_user()
        label = "</a><a class='reference' href='https://example.org'>My collection"
        collection = self.create_collection(label=label)
        db.session.commit()

        data = self.get_indexed_notification(
            role=role,
            event=Events.CREATE_COLLECTION,
            params={"collection": collection.id},
        )

        rendered = render_notification(role, data)
        assert rendered is not None

        html = rendered["html"]
        doc = document_fromstring(html)
        links = list(doc.iterlinks())

        assert len(links) == 1
        assert (
            links[0][0].text_content()
            == "</a><a class='reference' href='https://example.org'>My collection"
        )

    def test_render_notification_escape_plain_reference(self):
        role = self.create_user(
            name="<a href='https://example.org'>John Doe</a>",
            email="john.doe@example.org",
        )
        collection = self.create_collection(label="My collection")
        db.session.commit()
        update_role(role)

        data = self.get_indexed_notification(
            role=role,
            event=Events.CREATE_COLLECTION,
            params={"collection": collection.id},
        )

        rendered = render_notification(role, data)
        assert rendered is not None

        html = rendered["html"]
        doc = document_fromstring(html)
        links = list(doc.iterlinks())
        user = doc.find(".//span[@class='reference']").text_content()

        assert len(links) == 1
        assert links[0][0].text_content() == "My collection"

        assert (
            user == "<a href='https://example.org'>John Doe</a> <j*******@example.org>"
        )
