from datetime import datetime, timedelta

from aleph.core import db
from aleph.model import Alert, Notification
from aleph.logic.alerts import check_alerts
from aleph.tests.util import TestCase


class AlertsTestCase(TestCase):

    def setUp(self):
        super(AlertsTestCase, self).setUp()
        self.load_fixtures('docs.yaml')
        self.email = 'test@pudo.org'
        self.role_email = self.create_user('with_email', email=self.email)
        self.role_no_email = self.create_user('without_email')
        self.role_no_email.email = None

    def test_notify(self):
        data = {'query_text': '', 'label': 'Test Alert'}
        alert = Alert.create(data, self.role_email)
        alert.notified_at = datetime.utcnow() + timedelta(hours=72)
        db.session.commit()

        notcount = Notification.all().count()
        assert notcount == 0, notcount

        db.session.refresh(alert)
        alert.notified_at = datetime.utcnow() - timedelta(hours=72)
        db.session.add(alert)
        db.session.commit()

        check_alerts()
        notcount = Notification.all().count()
        assert notcount == 3, notcount

        check_alerts()
        notcount = Notification.all().count()
        assert notcount == 3, notcount

    def test_notify_no_email(self):
        data = {'query': {}, 'custom_label': 'Test Alert'}
        assert self.role_no_email.email is None, self.role_no_email.email
        alert = Alert.create(data, self.role_no_email)
        alert.notified_at = datetime.utcnow() - timedelta(hours=72)
        db.session.commit()

        notcount = Notification.all().count()
        assert notcount == 0, notcount
