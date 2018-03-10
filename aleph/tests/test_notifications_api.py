from pprint import pprint  # noqa

from aleph.core import db
from aleph.model import Events, Notification
from aleph.logic.roles import update_role
from aleph.logic.notifications import publish
from aleph.tests.util import TestCase


class NotificationsApiTestCase(TestCase):

    def setUp(self):
        super(NotificationsApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id='user')
        self.admin = self.create_user(foreign_id='admin')
        self.col = self.create_collection()
        update_role(self.rolex)
        update_role(self.admin)
        event = Events.PUBLISH_COLLECTION
        publish(event, self.admin.id, params={
            'collection': self.col
        }, channels=[Notification.GLOBAL])
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
        _, headers = self.login(foreign_id='admin')
        res = self.client.get('/api/2/notifications', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 0, res.json

        _, headers = self.login(foreign_id='user')
        res = self.client.get('/api/2/notifications', headers=headers)
        assert res.status_code == 200, res
        assert res.json['total'] == 2, res.json
