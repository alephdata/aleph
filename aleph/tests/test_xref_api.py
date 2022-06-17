# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from aleph.core import db
from aleph.queues import get_stage, OP_XREF
from aleph.index.entities import index_entity
from aleph.logic import xref
from aleph.tests.util import TestCase, get_caption


class XrefApiTestCase(TestCase):
    def setUp(self):
        super(XrefApiTestCase, self).setUp()
        xref.SCORE_CUTOFF = 0.01
        self.creator = self.create_user(foreign_id="creator")
        self.outsider = self.create_user(foreign_id="outsider")

        # First public collection and entities
        self.residents = self.create_collection(
            label="Residents of Habitat Ring",
            foreign_id="test_residents",
            creator=self.creator,
        )

        self.ent = self.create_entity(
            {"schema": "Person", "properties": {"name": "Elim Garak"}}, self.residents
        )

        self.ent2 = self.create_entity(
            {"schema": "Person", "properties": {"name": "Leeta"}}, self.residents
        )

        # Second public collection and entities
        self.dabo = self.create_collection(
            label="Dabo Girls", foreign_id="test_dabo", creator=self.creator
        )
        self.grant_publish(self.dabo)

        self.ent3 = self.create_entity(
            {"schema": "Person", "properties": {"name": "MPella"}}, self.dabo
        )

        self.ent4 = self.create_entity(
            {"schema": "Person", "properties": {"name": "Leeta"}}, self.dabo
        )

        self.ent5 = self.create_entity(
            {"schema": "Person", "properties": {"name": "Mardah"}}, self.dabo
        )

        # Private collection and entities
        self.obsidian = self.create_collection(
            label="Obsidian Order", foreign_id="test_obsidian", creator=self.creator
        )

        self.ent6 = self.create_entity(
            {"schema": "Person", "properties": {"name": "Elim Garak"}}, self.obsidian
        )

        self.ent7 = self.create_entity(
            {"schema": "Person", "properties": {"name": "Enabran Tain"}}, self.obsidian
        )

        db.session.commit()
        index_entity(self.ent)
        index_entity(self.ent2)
        index_entity(self.ent3)
        index_entity(self.ent4)
        index_entity(self.ent5)
        index_entity(self.ent6)
        index_entity(self.ent7)
        self.stage = get_stage(self.residents, OP_XREF)

    def test_export(self):
        xref.xref_collection(self.residents)
        url = "/api/2/collections/%s/xref.xlsx" % self.obsidian.id
        res = self.client.post(url)
        assert res.status_code == 403, res

        _, headers = self.login(foreign_id="creator")
        res = self.client.post(url, headers=headers)
        assert res.status_code == 202, res

    def test_matches(self):
        xref.xref_collection(self.residents)
        url = "/api/2/collections/%s/xref" % self.residents.id
        # Not logged in
        res = self.client.get(url)
        assert res.status_code == 403, res

        self.grant_publish(self.residents)
        res = self.client.get(url)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        res0 = res.json["results"][0]
        assert "Leeta" in get_caption(res0["entity"])
        assert "Garak" not in get_caption(res0["entity"])
        assert "Tain" not in get_caption(res0["match"])
        assert "MPella" not in get_caption(res0["match"])

        # Logged in as outsider (restricted)
        _, headers = self.login("outsider")

        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 1, res.json
        res0 = res.json["results"][0]
        assert "Leeta" in get_caption(res0["entity"])
        assert "Garak" not in get_caption(res0["entity"])
        assert "Tain" not in get_caption(res0["match"])
        assert "MPella" not in get_caption(res0["match"])

        # Logged in as creator (all access)
        _, headers = self.login("creator")

        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 2, res.json
        res0 = res.json["results"][0]
        assert "Garak" in get_caption(res0["entity"])
        assert "Leeta" not in get_caption(res0["entity"])
        assert "Tain" not in get_caption(res0["match"])
        assert "MPella" not in get_caption(res0["match"])
        res1 = res.json["results"][1]
        assert "Leeta" in get_caption(res1["entity"])
        assert "Garak" not in get_caption(res1["entity"])
        assert "Tain" not in get_caption(res1["match"])
        assert "MPella" not in get_caption(res1["match"])

    def test_create_matches(self):
        url = "/api/2/collections/%s/xref" % self.residents.id
        res = self.client.post(url)
        assert res.status_code == 403, res

        _, headers = self.login("outsider")
        res = self.client.post(url, headers=headers)
        assert res.status_code == 403, res

        _, headers = self.login("creator")
        res = self.client.post(url, headers=headers)
        assert res.status_code == 202, res

        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res
        assert res.json["total"] == 2, res.json

    def test_decide(self):
        _, headers = self.login("creator")
        url = "/api/2/collections/%s/xref" % self.residents.id
        res = self.client.post(url, headers=headers)
        assert res.status_code == 202, res

        res = self.client.get(url, headers=headers)
        assert res.json["total"] == 2, res.json
        xref = res.json["results"][0]
        assert xref.get("judgement") == "no_judgement", xref

        pairwise_url = "/api/2/profiles/_pairwise"
        res = self.client.post(
            pairwise_url,
            headers=headers,
            json={
                "judgement": "positive",
                "entity_id": xref["entity"]["id"],
                "match_id": xref["match"]["id"],
            },
        )
        assert res.status_code == 200, res.json

        res = self.client.get(url, headers=headers)
        assert res.json["total"] == 2, res.json
        judgement = None
        for xrefi in res.json["results"]:
            if xrefi["id"] == xref["id"]:
                judgement = xrefi.get("judgement")
        assert judgement == "positive", xrefi

        res = self.client.post(
            pairwise_url,
            headers=headers,
            json={
                "judgement": "negative",
                "entity_id": xref["entity"]["id"],
                "match_id": xref["match"]["id"],
            },
        )
        assert res.status_code == 200, res.json

        res = self.client.get(url, headers=headers)
        judgement = None
        for xrefi in res.json["results"]:
            if xrefi["id"] == xref["id"]:
                judgement = xrefi.get("judgement")
        assert judgement == "negative", xrefi
