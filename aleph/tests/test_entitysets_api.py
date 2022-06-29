# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT


from unittest import skip  # noqa
import json
import logging
from pprint import pprint  # noqa

from banal import ensure_list
from followthemoney import model
from followthemoney.util import get_entity_id
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.tests.util import TestCase
from aleph.views.util import validate
from aleph.logic.collections import delete_collection

log = logging.getLogger(__name__)


def _normalize_data(data):
    """Turn entities in properties into entity ids"""
    entities = data["layout"]["entities"]
    for obj in entities:
        schema = model.get(obj.get("schema"))
        if schema is None:
            raise InvalidData("Invalid schema %s" % obj.get("schema"))
        properties = obj.get("properties", {})
        for name, values in list(properties.items()):
            prop = schema.get(name)
            if prop.type == registry.entity:
                properties[prop.name] = []
                for value in ensure_list(values):
                    entity_id = get_entity_id(value)
                    properties[prop.name].append(entity_id)
    return data


class EntitySetAPITest(TestCase):
    def setUp(self):
        super(EntitySetAPITest, self).setUp()
        self.col = self.create_collection(data={"foreign_id": "coll1"})
        self.col2 = self.create_collection(data={"foreign_id": "coll2"})
        _, self.headers = self.login(is_admin=True)
        self.rolex = self.create_user(foreign_id="user_3")
        _, self.headers_x = self.login(foreign_id="user_3")
        self.input_data = self._load_data_for_import("royal-family.vis")
        # pprint(self.input_data)

    def _load_data_for_import(self, fixture):
        fixture = self.get_fixture_path(fixture)
        with open(fixture, "r") as fp:
            data = json.load(fp)
        layout = data.pop("layout")
        entities = layout.pop("entities")
        return {
            "collection_id": str(self.col.id),
            "layout": layout,
            "entities": entities,
            "label": "Royal Family",
            "type": "diagram",
            "summary": "...",
        }

    def test_entityset_crud(self):
        url = "/api/2/entitysets"
        res = self.client.post(url, json=self.input_data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitySet")
        ent_id = self.input_data["entities"][0]["id"]
        assert ent_id in str(res.json), res.json
        entityset_id = res.json["id"]

        url = "/api/2/entitysets"
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert len(res.json["results"]) == 1

        url = "/api/2/entitysets?filter:collection_id=%s" % self.col.id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert len(res.json["results"]) == 1
        res = self.client.get(url, headers=self.headers_x)
        assert res.status_code == 200, res
        assert len(res.json["results"]) == 0
        url = "/api/2/entitysets?filter:collection_id=%s" % self.col2.id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert len(res.json["results"]) == 0

        url = "/api/2/entitysets/%s" % entityset_id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitySet")
        assert res.json["label"] == "Royal Family"
        res_str = json.dumps(res.json)
        assert "Philip" in res_str

        data = self._load_data_for_import("royal-family.vis")
        data["label"] = "Royal Family v2"
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitySet")
        assert res.json["label"] == "Royal Family v2"
        assert res.json["summary"] == "..."

        res = self.client.delete(url, headers=self.headers)
        assert res.status_code == 204, res
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404, res

    def test_entityset_entities_query(self):
        url = "/api/2/entitysets"
        res = self.client.post(url, json=self.input_data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitySet")
        entityset_id = res.json["id"]

        entityset2_data = self._load_data_for_import("royal-family-v2.vis")
        res = self.client.post(url, json=entityset2_data, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitySet")
        entityset2_id = res.json["id"]

        query_url = "/api/2/entitysets/%s/entities?filter:schemata=%s"
        url = query_url % (entityset_id, "Thing")
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitiesResponse")
        assert len(res.json["results"]) == 3, len(res.json["results"])

        res = self.client.get(url + "&facet=names", headers=self.headers)
        assert res.status_code == 200, res
        facet = res.json["facets"]["names"]
        assert len(facet["values"]) == 3, facet["values"]
        assert "Elizabeth" in str(facet["values"]), facet["values"]

        url = query_url % (entityset_id, "Interval")
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitiesResponse")
        assert len(res.json["results"]) == 4, len(res.json["results"])

        url = query_url % (entityset2_id, "Interval")
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitiesResponse")
        assert len(res.json["results"]) == 2, len(res.json["results"])

    def test_entityset_entities_upsert(self):
        url = "/api/2/entitysets"
        res = self.client.post(url, json=self.input_data, headers=self.headers)
        entityset_id = res.json["id"]
        url = "/api/2/entitysets/%s/entities" % entityset_id
        data = {
            "schema": "Person",
            "id": "deadbeef",
            "properties": {"name": ["Test Person"]},
        }
        res = self.client.post(url, json=data)
        assert res.status_code == 403, res
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["schema"] == "Person", res.json
        assert res.json["id"] != data["id"], res.json
        assert res.json["id"].startswith(data["id"]), res.json

        data = dict(res.json)
        data["properties"]["nationality"] = ["np"]
        res2 = self.client.post(url, json=data, headers=self.headers)
        assert res2.status_code == 200, res2
        assert res2.json["id"] == res.json["id"], res2.json
        assert "np" in res2.json["properties"]["nationality"], res2.json

        embed_url = "/api/2/entitysets/%s/embed" % entityset_id
        res = self.client.post(embed_url)
        assert res.status_code == 403, res
        res = self.client.post(embed_url, headers=self.headers)
        assert res.status_code == 200, res
        data = dict(res.json)
        assert len(res.json["embed"]) > 1000, res.json
        assert res.json["url"] is None

    def test_entity_entitysets(self):
        url = "/api/2/entitysets"
        res = self.client.post(url, json=self.input_data, headers=self.headers)
        assert res.status_code == 200, res

        colid = str(self.col.id)
        entityset_id = res.json["id"]

        url = f"/api/2/entitysets/{entityset_id}/entities?filter:schemata=Person"
        res = self.client.get(url, headers=self.headers)
        ent_id = res.json["results"][0]["id"]

        url = f"/api/2/entities/{ent_id}/entitysets"
        res = self.client.get(url, headers=self.headers)
        assert entityset_id in {e["id"] for e in res.json["results"]}, res.json

        url = f"/api/2/entities/{ent_id}/entitysets?filter:collection_id={colid}&filter:type=diagram&filter:judgement=positive"
        res = self.client.get(url, headers=self.headers)
        assert entityset_id in {e["id"] for e in res.json["results"]}, res.json

        for filt in (
            "collection_id=66666",
            "label=asdfadsfs",
            "judgement=no_judgement",
            "type=timeline",
        ):
            url = f"/api/2/entities/{ent_id}/entitysets?filter:{filt}"
            res = self.client.get(url, headers=self.headers)
            assert entityset_id not in {e["id"] for e in res.json["results"]}, res.json

    def test_entityset_items_query(self):
        url = "/api/2/entitysets"
        res = self.client.post(url, json=self.input_data, headers=self.headers)
        assert res.status_code == 200, res
        entityset_id = res.json["id"]

        url = "/api/2/entitysets/%s/items" % entityset_id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "EntitySetItemResponse")
        assert len(res.json["results"]) == 7, len(res.json["results"])

        fst = res.json["results"][0]
        fst["judgement"] = "negative"
        res = self.client.post(url, json=fst)
        assert res.status_code == 403, res
        res = self.client.post(url, json=fst, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["judgement"] == "negative", res

        res = self.client.get(url, headers=self.headers)
        assert len(res.json["results"]) == 7, len(res.json["results"])

        fst["judgement"] = "no_judgement"
        res = self.client.post(url, json=fst, headers=self.headers)
        assert res.status_code == 200, res
        assert res.json["judgement"] == "no_judgement", res

        res = self.client.get(url, headers=self.headers)
        assert len(res.json["results"]) == 6, len(res.json["results"])

    def test_create_empty(self):
        data = {
            "label": "hello",
            "type": "list",
            "collection_id": str(self.col.id),
        }
        url = "/api/2/entitysets"
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res

    def test_create_without_collection_id(self):
        data = {
            "label": "hello",
        }
        url = "/api/2/entitysets"
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 400, res

    def test_unauthorized_create(self):
        url = "/api/2/entitysets"
        data = {
            "label": "hello",
            "type": "diagram",
            "collection_id": str(self.col.id),
        }
        res = self.client.post(url, json=data, headers=self.headers_x)
        assert res.status_code == 403, res

    def test_delete_when_collection_deleted(self):
        data = {
            "label": "hello",
            "type": "list",
            "collection_id": str(self.col.id),
        }
        url = "/api/2/entitysets"
        res = self.client.post(url, json=data, headers=self.headers)
        assert res.status_code == 200, res
        entityset_id = res.json["id"]
        delete_collection(self.col)
        url = "/api/2/entitysets/%s" % entityset_id
        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 404, res

    def test_entitysets_types_filter(self):
        entitysets = (
            {
                "label": "Timeline",
                "type": "timeline",
                "collection_id": str(self.col.id),
            },
            {"label": "Diagram", "type": "diagram", "collection_id": str(self.col.id)},
            {"label": "List", "type": "list", "collection_id": str(self.col.id)},
        )
        url = "/api/2/entitysets"
        for eset in entitysets:
            res = self.client.post(url, json=eset, headers=self.headers)
            assert res.status_code == 200, res

        res = self.client.get(url, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert len(res.json["results"]) == 3

        for qfilter in ("timeline", "diagram", "list"):
            res = self.client.get(url + f"?filter:type={qfilter}", headers=self.headers)
            assert res.status_code == 200, res
            validate(res.json, "QueryResponse")
            assert len(res.json["results"]) == 1

        qurl = url + "?filter:type=timeline&filter:type=diagram"
        res = self.client.get(qurl, headers=self.headers)
        assert res.status_code == 200, res
        validate(res.json, "QueryResponse")
        assert len(res.json["results"]) == 2
