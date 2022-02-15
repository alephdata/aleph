import json
from unittest import skip  # noqa

from aleph.core import db
from aleph.authz import Authz
from aleph.tests.util import TestCase, JSON
from aleph.logic.xref import xref_collection
from aleph.index.xref import iter_matches
from aleph.queues import get_stage, OP_XREF


class XrefTestCase(TestCase):
    def setUp(self):
        super(XrefTestCase, self).setUp()
        self.user = self.create_user()
        self.coll_a = self.create_collection(creator=self.user)
        self.coll_b = self.create_collection(creator=self.user)
        self.coll_c = self.create_collection(creator=self.user)
        db.session.commit()
        self.stage = get_stage(self.coll_a, OP_XREF, job_id="unit_test")
        self.authz = Authz.from_role(self.user)

        _, headers = self.login(foreign_id=self.user.foreign_id)
        url = "/api/2/entities"

        entity1 = {
            "schema": "Person",
            "collection_id": str(self.coll_a.id),
            "properties": {"name": "Carlos Danger", "nationality": "US"},
        }
        self.entity1 = self.client.post(
            url,
            data=json.dumps(entity1),
            headers=headers,
            content_type=JSON,
        )
        entity2 = {
            "schema": "Person",
            "collection_id": str(self.coll_b.id),
            "properties": {"name": "Carlos Danger", "nationality": "US"},
        }
        self.entity2 = self.client.post(
            url,
            data=json.dumps(entity2),
            headers=headers,
            content_type=JSON,
        )
        entity3 = {
            "schema": "LegalEntity",
            "collection_id": str(self.coll_b.id),
            "properties": {"name": "Carlos Danger", "country": "GB"},
        }
        self.entity3 = self.client.post(
            url,
            data=json.dumps(entity3),
            headers=headers,
            content_type=JSON,
        )
        entity4 = {
            "schema": "Person",
            "collection_id": str(self.coll_b.id),
            "properties": {"name": "Pure Risk", "nationality": "US"},
        }
        self.entity4 = self.client.post(
            url,
            data=json.dumps(entity4),
            headers=headers,
            content_type=JSON,
        )

        entity5 = {
            "schema": "LegalEntity",
            "collection_id": str(self.coll_c.id),
            "properties": {"name": "Carlos Danger", "country": "GB"},
        }
        self.entity5 = self.client.post(
            url,
            data=json.dumps(entity5),
            headers=headers,
            content_type=JSON,
        )

    def test_xref(self):
        matches = list(iter_matches(self.coll_a, self.authz))
        assert 0 == len(matches), len(matches)
        xref_collection(self.coll_a)
        matches = list(iter_matches(self.coll_a, self.authz))
        match_collection_ids = set(
            [match.get("match_collection_id") for match in matches]
        )
        assert match_collection_ids == {
            self.coll_b.id,
            self.coll_c.id,
        }, match_collection_ids
        match_ids = set([match.get("match_id") for match in matches])
        assert match_ids == {
            self.entity2.get_json().get("id"),
            self.entity3.get_json().get("id"),
            self.entity5.get_json().get("id"),
        }, match_ids
        assert 3 == len(matches), len(matches)
        for match in matches:
            if match.get("id") == self.entity5.get_json().get("id"):
                assert match.get("match_collection_id") == self.coll_c.id, match
                assert match.get("collection_id") == self.coll_a.id, match
