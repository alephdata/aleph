# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT


import logging

# from pprint import pformat
from followthemoney import model

from aleph.core import db
from aleph.authz import Authz
from aleph.model import EntitySet, EntitySetItem, Judgement
from aleph.logic.entitysets import save_entityset_item
from aleph.index.entities import index_entity
from aleph.tests.util import TestCase

log = logging.getLogger(__name__)


class ProfilesApiTestCase(TestCase):
    def setUp(self):
        super(ProfilesApiTestCase, self).setUp()
        self.rolex = self.create_user(foreign_id="rolex")
        self.col1 = self.create_collection()
        self.grant(self.col1, self.rolex, True, True)
        authz = Authz.from_role(self.rolex)
        self.profile = EntitySet.create(
            {"label": "x", "type": EntitySet.PROFILE}, self.col1, authz
        )
        ent1 = {
            "schema": "LegalEntity",
            "properties": {
                "name": "Donald Trump",
                "address": "721 Fifth Avenue, New York, NY",
                "phone": "+12024561414",
            },
        }
        self.ent1 = self.create_entity(ent1, self.col1)
        index_entity(self.ent1)
        EntitySetItem.save(self.profile, self.ent1.id, collection_id=self.col1.id)

        self.col2 = self.create_collection()
        self.grant_publish(self.col2)
        ent2 = {
            "schema": "Person",
            "properties": {
                "name": "Donald J. Trump",
                "position": "45th President of the US",
                "phone": "+12024561414",
            },
        }
        self.ent2 = self.create_entity(ent2, self.col2)
        index_entity(self.ent2)
        EntitySetItem.save(self.profile, self.ent2.id, collection_id=self.col2.id)

        ent_false = {
            "schema": "LegalEntity",
            "properties": {"name": "Donald Trump, Jr", "email": "junior@trump.org"},
        }
        self.ent_false = self.create_entity(ent_false, self.col2)
        index_entity(self.ent_false)
        EntitySetItem.save(
            self.profile,
            self.ent_false.id,
            collection_id=self.col2.id,
            judgement=Judgement.NEGATIVE,
        )

        self.col3 = self.create_collection()
        ent3 = {
            "schema": "LegalEntity",
            "properties": {"name": "Donald John Trump", "birthDate": "1964"},
        }
        self.ent3 = self.create_entity(ent3, self.col3)
        index_entity(self.ent3)
        EntitySetItem.save(self.profile, self.ent3.id, collection_id=self.col3.id)
        db.session.commit()

    def test_profile_view(self):
        res = self.client.get("/api/2/profiles/bananana")
        assert res.status_code == 404, res.json
        url = "/api/2/profiles/%s" % self.profile.id
        res = self.client.get(url)
        assert res.status_code == 403, res.status_code
        _, headers = self.login(foreign_id="rolex")
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res.json
        merged = model.get_proxy(res.json.get("merged"))
        assert merged.schema.name == "Person", merged.schema
        assert merged.id == self.profile.id
        assert "Fifth" in merged.first("address"), merged.to_dict()
        assert not merged.has("email"), merged.to_dict()
        assert not merged.has("birthDate"), merged.to_dict()
        assert len(res.json.get("entities")) == 2, res.json

        self.grant_publish(self.col3)
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res.json
        assert len(res.json.get("entities")) == 3, res.json

    def test_profile_tags(self):
        url = "/api/2/profiles/%s/tags" % self.profile.id
        res = self.client.get(url)
        assert res.status_code == 403, res.json
        _, headers = self.login(foreign_id="rolex")
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res.json
        assert res.json["total"] == 1, res.json
        assert res.json["results"][0]["field"] == "phones", res.json

    def test_profile_similar(self):
        url = "/api/2/profiles/%s/similar" % self.profile.id
        res = self.client.get(url)
        assert res.status_code == 403, res.json
        _, headers = self.login(foreign_id="rolex")
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res.json
        assert res.json["total"] == 0, res.json
        save_entityset_item(
            self.profile,
            self.col3,
            self.ent3.id,
            judgement=Judgement.NO_JUDGEMENT,
        )
        db.session.commit()
        self.grant_publish(self.col3)
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res.json
        assert res.json["total"] == 1, res.json

    def test_profile_expand(self):
        usg = {
            "schema": "PublicBody",
            "properties": {"name": "US Government"},
        }
        usg = self.create_entity(usg, self.col2)
        index_entity(usg)
        membership = {
            "schema": "Membership",
            "properties": {
                "organization": usg.id,
                "member": self.ent2.id,
                "role": "Chief executive",
            },
        }
        membership = self.create_entity(membership, self.col2)
        index_entity(membership)
        passport = {
            "schema": "Passport",
            "properties": {"holder": self.ent1.id},
        }
        passport = self.create_entity(passport, self.col1)
        index_entity(passport)
        url = "/api/2/profiles/%s/expand" % self.profile.id
        res = self.client.get(url)
        assert res.status_code == 403, res.json
        _, headers = self.login(foreign_id="rolex")
        res = self.client.get(url, headers=headers)
        assert res.status_code == 200, res.json
        assert res.json["total"] == 2, res.json
