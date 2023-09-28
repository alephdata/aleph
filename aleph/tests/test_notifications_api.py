from pprint import pprint  # noqa

from aleph.core import db
from aleph.model import Events, Role
from aleph.logic.roles import update_role
from aleph.logic.notifications import publish, GLOBAL
from aleph.validation import validate
from aleph.tests.util import TestCase


class NotificationsApiTestCase(TestCase):
    def setUp(self):
        super(NotificationsApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id="rolex")
        self.admin = self.create_user(foreign_id="admin")
        self.col = self.create_collection(creator=self.admin)
        update_role(self.rolex)
        update_role(self.admin)
        event = Events.PUBLISH_COLLECTION
        publish(
            event, self.admin.id, params={"collection": self.col}, channels=[GLOBAL]
        )
        event = Events.GRANT_COLLECTION
        publish(
            event,
            self.admin.id,
            params={"collection": self.col, "role": self.rolex},
            channels=[self.col, self.rolex],
        )
        db.session.commit()

    def test_anonymous(self):
        res = self.client.get("/api/2/notifications")
        assert res.status_code == 401, res

    def test_notifications(self):
        _, headers = self.login(foreign_id="admin")
        res = self.client.get("/api/2/notifications", headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 0, res.json

        assert self.rolex.type == Role.USER, self.rolex.type
        _, headers = self.login(foreign_id=self.rolex.foreign_id)
        res = self.client.get("/api/2/notifications", headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 2, res.json
        not0 = res.json["results"][0]
        validate(not0, "Notification")

        role = not0["params"]["role"]
        assert isinstance(role, dict), not0
        assert "actor" in not0["params"], not0["params"]
