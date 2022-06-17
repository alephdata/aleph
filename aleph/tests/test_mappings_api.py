# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from unittest import skip  # noqa
import json
import logging

from followthemoney import model
from followthemoney.proxy import EntityProxy

from aleph.core import archive
from aleph.index.entities import index_proxy
from aleph.logic.aggregator import get_aggregator
from aleph.views.util import validate
from aleph.tests.util import TestCase

log = logging.getLogger(__name__)


class MappingAPITest(TestCase):
    def setUp(self):
        super(MappingAPITest, self).setUp()
        self.col = self.create_collection(foreign_id="map1")
        aggregator = get_aggregator(self.col)
        aggregator.delete()
        _, self.headers = self.login(is_admin=True)
        self.rolex = self.create_user(foreign_id="user_3")
        _, self.headers_x = self.login(foreign_id="user_3")
        self.fixture = self.get_fixture_path("experts.csv")
        self.content_hash = archive.archive_file(self.fixture)
        data = {
            "id": "foo",
            "schema": "Table",
            "properties": {
                "csvHash": self.content_hash,
                "contentHash": self.content_hash,
                "mimeType": "text/csv",
                "fileName": "experts.csv",
                "name": "experts.csv",
            },
        }
        self.ent = EntityProxy.from_dict(model, data, cleaned=False)
        self.ent.id = self.col.ns.sign(self.ent.id)
        index_proxy(self.col, self.ent)
        data = {
            "id": "foo2",
            "schema": "Table",
            "properties": {
                "csvHash": self.content_hash,
                "contentHash": self.content_hash,
                "mimeType": "text/csv",
                "fileName": "experts.csv",
                "name": "experts.csv",
            },
        }
        self.ent2 = EntityProxy.from_dict(model, data, cleaned=False)
        self.ent2.id = self.col.ns.sign(self.ent2.id)
        index_proxy(self.col, self.ent2)
        data = {
            "id": "bar",
            "schema": "LegalEntity",
            "properties": {"name": "John Doe"},
        }
        ent = EntityProxy.from_dict(model, data, cleaned=False)
        ent.id = self.col.ns.sign(ent.id)
        index_proxy(self.col, ent)

    def test_mapping(self):
        col_id = self.col.id
        url = "/api/2/collections/%s/mappings" % col_id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        res = self.client.get(url, headers=self.headers_x)
        assert res.status_code == 403, res

        url = "/api/2/collections/%s/mappings?filter:table=%s" % (col_id, self.ent.id)
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")

        data = {
            "table_id": self.ent.id,
            "mapping_query": {
                "person": {
                    "schema": "Person",
                    "keys": ["name", "nationality"],
                    "properties": {
                        "name": {"column": "name"},
                        "nationality": {"column": "nationality"},
                    },
                }
            },
        }
        res = self.client.post(url, json=data, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "Mapping")
        mapping_id = res.json.get("id")

        index_url = (
            "/api/2/entities?filter:collection_id=%s&filter:schemata=LegalEntity"
        )
        index_url = index_url % col_id
        res = self.client.get(index_url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json

        url = "/api/2/collections/%s/mappings/%s/trigger" % (
            col_id,
            mapping_id,
        )
        res = self.client.post(url, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, headers=self.headers)
        assert res.status_code == 202, res

        url = "/api/2/collections/%s/mappings/%s" % (col_id, mapping_id)
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "Mapping")
        assert res.json["last_run_status"] == "successful", res.json
        assert "last_run_err_msg" not in res.json, res.json

        origin = "mapping%%3A%s" % mapping_id
        url = (
            "/api/2/entities?filter:collection_id=%s&filter:schema=Person&filter:origin=%s"
            % (col_id, origin)
        )
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res.json
        assert res.json["total"] == 14, res.json
        person = res.json["results"][0]["properties"]
        assert person.get("proof")[0].get("id") == self.ent.id, person

        # test deleting loaded entities
        url = "/api/2/collections/%s/mappings/%s/flush" % (
            col_id,
            mapping_id,
        )
        res = self.client.post(url, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, headers=self.headers)
        assert res.status_code == 202, res
        res = self.client.get(index_url, headers=self.headers)
        assert res.status_code == 200, res
        # The pre-existing legal entity should not be deleted
        assert res.json["total"] == 1, res.json

        data = {
            "table_id": self.ent2.id,
            "mapping_query": {
                "person": {
                    "schema": "Person",
                    "keys": ["name", "nationality"],
                    "properties": {
                        "name": {"column": "name"},
                        "nationality": {"column": "nationality"},
                        "gender": {"column": "gender"},
                    },
                }
            },
        }
        url = "/api/2/collections/%s/mappings/%s" % (col_id, mapping_id)
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        assert "gender" not in json.dumps(res.json["query"]), res.json
        url = "/api/2/collections/%s/mappings/%s" % (col_id, mapping_id)
        res = self.client.post(url, json=data, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json.get("table_id") == self.ent2.id, res.json
        assert "gender" in json.dumps(res.json["query"])
        res = self.client.get(index_url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json

        url = "/api/2/collections/%s/mappings/%s/trigger" % (
            col_id,
            mapping_id,
        )
        res = self.client.post(url, headers=self.headers)
        res = self.client.get(index_url, headers=self.headers)
        assert res.json["total"] == 15, res.json

        url = "/api/2/collections/%s/mappings/%s" % (col_id, mapping_id)
        res = self.client.delete(url, headers=self.headers_x)
        assert res.status_code == 403, res
        res = self.client.delete(url, headers=self.headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404, res
        res = self.client.get(index_url, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
