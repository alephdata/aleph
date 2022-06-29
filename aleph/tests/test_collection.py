# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT


from aleph.logic.collections import delete_collection
from aleph.tests.util import TestCase


class IndexTestCase(TestCase):
    def test_delete_collection(self):
        self.load_fixtures()
        url = "/api/2/entities?filter:schemata=Thing&q=kwazulu"
        res = self.client.get(url)
        assert res.json["total"] == 1, res.json
        delete_collection(self.public_coll)
        res = self.client.get(url)
        assert res.json["total"] == 0, res.json
