from aleph.core import db
from aleph.model import Events, Notification
from aleph.logic.notifications import publish
from aleph.tests.util import TestCase


class NotificationsTestCase(TestCase):

    def setUp(self):
        super(NotificationsTestCase, self).setUp()

    def test_publish_event(self):
        event = Events.PUBLISH_COLLECTION
        role = self.create_user()
        collection = self.create_collection(foreign_id='NoNoNo')
        publish(event, role, params={'collection': collection})
        db.session.commit()

        notifications = Notification.all().all()
        assert 1 == len(notifications), notifications
        not0 = notifications[0]
        assert not0._event == event['name'], not0._event
        assert not0.params['collection'] == collection.id, not0.params
