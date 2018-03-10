from pprint import pprint  # noqa

from aleph.core import db
from aleph.model import Events
from aleph.logic.notifications import publish
from aleph.tests.util import TestCase


class NotificationsApiTestCase(TestCase):

    def setUp(self):
        super(NotificationsApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user')
        self.admin = self.create_user(foreign_id='admin')
        self.col = self.create_collection()
        event = Events.PUBLISH_COLLECTION
        publish(event, self.admin.id, params={
            'collection': self.col
        })
        event = Events.GRANT_COLLECTION
        publish(event, self.admin.id, params={
            'collection': self.col,
            'role': self.rolex
        })
        db.session.commit()

    def test_anonymous(self):
        res = self.client.get('/api/2/notifications')
        assert res.status_code == 403, res

    def test_notifications(self):
        _, headers = self.login(is_admin=True)
        res = self.client.get('/api/2/notifications', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 2, res.json
