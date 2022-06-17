# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from datetime import datetime, timedelta

from aleph.core import db
from aleph.model import Alert
from aleph.logic.alerts import check_alerts
from aleph.logic.notifications import get_notifications
from aleph.tests.util import TestCase


class AlertsTestCase(TestCase):
    def setUp(self):
        super(AlertsTestCase, self).setUp()
        self.load_fixtures()
        self.email = "test@pudo.org"
        self.role_email = self.create_user("with_email", email=self.email)
        self.role_no_email = self.create_user("without_email")
        self.role_no_email.email = None

    def test_notify(self):
        data = {"query": "Kashmir"}
        failed_alert = Alert.create(data, self.role_no_email.id)
        failed_alert.notified_at = datetime.utcnow() - timedelta(hours=72)

        alert = Alert.create(data, self.role_email.id)
        alert.notified_at = datetime.utcnow() + timedelta(hours=72)
        db.session.commit()

        res = get_notifications(self.role_email)
        notcount = res.get("hits").get("total").get("value")
        assert notcount == 0, notcount

        db.session.refresh(alert)
        alert.notified_at = datetime.utcnow() - timedelta(hours=72)
        db.session.add(alert)
        db.session.commit()

        check_alerts()
        res = get_notifications(self.role_email)
        notcount = res.get("hits").get("total").get("value")
        assert notcount == 1, res.get("hits")

        check_alerts()
        res = get_notifications(self.role_email)
        notcount = res.get("hits").get("total").get("value")
        assert notcount == 1, res.get("hits")
