# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from aleph.model import Judgement
from aleph.logic.profiles import decide_pairwise, collection_profiles
from aleph.tests.util import TestCase


class ProfileTestCase(TestCase):
    def test_decide_xref(self):
        w = self.create_user("user")
        coll = self.create_collection()
        a1 = {"id": "a1", "schema": "Person"}
        a2 = {"id": "a2", "schema": "Person"}
        profile_t1 = decide_pairwise(
            coll, a1, coll, a2, judgement=Judgement.POSITIVE, authz=w
        )
        assert profile_t1.collection_id == coll.id, profile_t1
        assert len(profile_t1.items().all()) == 2, profile_t1
        assert all(
            e.judgement == Judgement.POSITIVE and e.entity_id in ("a1", "a2")
            for e in profile_t1.items()
        )

        b1 = {"id": "b1", "schema": "Person"}
        profile_t2 = decide_pairwise(
            coll, a1, coll, b1, judgement=Judgement.NEGATIVE, authz=w
        )
        assert profile_t1.id == profile_t2.id, (profile_t1, profile_t2)
        assert len(profile_t2.items().all()) == 3, profile_t2
        assert all(
            e.judgement == Judgement.POSITIVE
            if e.entity_id.startswith("a")
            else Judgement.NEGATIVE
            for e in profile_t2.items()
        )

        b2 = {"id": "b2", "schema": "Person"}
        profile_t3 = decide_pairwise(
            coll, b1, coll, b2, judgement=Judgement.NEGATIVE, authz=w
        )
        assert profile_t1.id != profile_t3.id != profile_t2.id

        profile_t4 = decide_pairwise(
            coll, a1, coll, b1, judgement=Judgement.UNSURE, authz=w
        )
        assert profile_t4.id == profile_t2.id

    def test_collection_profiles(self):
        w = self.create_user("user")
        coll = self.create_collection()
        a1 = {"id": "a1", "schema": "Person"}
        a2 = {"id": "a2", "schema": "Person"}
        for judgement in Judgement:
            decide_pairwise(coll, a1, coll, a2, judgement=judgement, authz=w)
            result = list(collection_profiles(coll.id))
            assert len(result) == 1, len(result)
            profile, items = result[0]
            assert profile.collection_id == coll.id, profile.collection_id
            if judgement != Judgement.NO_JUDGEMENT:
                assert len(items) == 2, (judgement, len(items))
                assert [r == judgement for r in items]

        result = list(collection_profiles(coll.id, deleted=True))
        assert len(result) == 1, len(result)
        profile, items = result[0]
        assert profile.collection_id == coll.id, profile.collection_id
        assert len(items) == len(Judgement), len(items)

        decide_pairwise(coll, a1, coll, a2, judgement=Judgement.NEGATIVE, authz=w)
        result = list(collection_profiles(coll.id, judgements=[Judgement.POSITIVE]))
        assert len(result) == 1, len(result)
        profile, items = result[0]
        assert len(items) == 1
        assert items[0].entity_id == "a1"
