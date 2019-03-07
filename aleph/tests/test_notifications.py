from aleph.core import db, mail
from aleph.model import Events, Notification
from aleph.logic.notifications import publish, generate_digest
from aleph.logic.roles import update_role
from aleph.tests.util import TestCase


class NotificationsTestCase(TestCase):

    def setUp(self):
        super(NotificationsTestCase, self).setUp()

    def test_publish_event(self):
        role = self.create_user()
        email = 'test@aleph.skynet'
        label = 'So public'
        recipient = self.create_user(foreign_id='rolex',
                                     email=email)
        update_role(recipient)
        collection = self.create_collection(foreign_id='NoNoNo', label=label)
        event = Events.PUBLISH_COLLECTION
        publish(event, role.id,
                params={'collection': collection},
                channels=[Notification.GLOBAL])
        db.session.commit()

        notifications = Notification.all().all()
        assert 1 == len(notifications), notifications
        not0 = notifications[0]
        assert not0._event == event.name, not0._event
        assert not0.params['collection'] == str(collection.id), not0.params

        with mail.record_messages() as outbox:
            assert len(outbox) == 0, outbox
            generate_digest()
            assert len(outbox) == 1, outbox
            msg = outbox[0]
            assert email in msg.recipients, msg.recipients
            assert label in msg.html, msg.html
