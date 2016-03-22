from datetime import datetime, timedelta

from aleph.core import db, mail
from aleph.alerts import check_alerts
from aleph.model import Alert
from aleph.tests.util import TestCase


class AlertsTestCase(TestCase):

    def setUp(self):
        super(AlertsTestCase, self).setUp()
        self.load_fixtures('docs.yaml')
        self.email = 'test@pudo.org'
        self.role_email = self.create_user('with_email', email=self.email)
        self.role_no_email = self.create_user('without_email', email=None)

    def test_notify(self):
        data = {'query': {}, 'custom_label': 'Test Alert'}
        alert = Alert.create(data, self.role_email)
        alert.notified_at = datetime.utcnow() + timedelta(hours=72)
        db.session.commit()

        with mail.record_messages() as outbox:
            check_alerts()
            assert len(outbox) == 0, outbox

        db.session.refresh(alert)
        alert.notified_at = datetime.utcnow() - timedelta(hours=72)
        db.session.add(alert)
        db.session.commit()

        with mail.record_messages() as outbox:
            check_alerts()
            assert len(outbox) == 1, outbox
            msg = outbox[0]
            assert 'Test Alert' in msg.subject, msg
            assert 'test@pudo.org' in msg.recipients, msg

        with mail.record_messages() as outbox:
            check_alerts()
            assert len(outbox) == 0, outbox

    def test_notify_no_email(self):
        data = {'query': {}, 'custom_label': 'Test Alert'}
        assert self.role_no_email.email is None, self.role_no_email.email
        alert = Alert.create(data, self.role_no_email)
        alert.notified_at = datetime.utcnow() - timedelta(hours=72)
        db.session.commit()

        with mail.record_messages() as outbox:
            check_alerts()
            assert len(outbox) == 0, outbox
