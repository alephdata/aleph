# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

from aleph.views.util import validate
from aleph.tests.util import TestCase


class DashboardApiTestCase(TestCase):
    def setUp(self):
        super(DashboardApiTestCase, self).setUp()

    def test_index(self):
        res = self.client.get("/api/2/status")
        assert res.status_code == 403, res
        _, headers = self.login()
        res = self.client.get("/api/2/status", headers=headers)
        assert res.status_code == 200, res
        assert res.json.get("total") == 0, res.json
        _, headers = self.login(is_admin=True)
        res = self.client.get("/api/2/status", headers=headers)
        assert res.status_code == 200, res
        assert res.json.get("total") == 0, res.json
        validate(res.json, "SystemStatusResponse")
