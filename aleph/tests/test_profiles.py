from aleph.model import Judgement
from aleph.logic.profiles import decide_xref, collection_profiles
from aleph.tests.util import TestCase


class ProfileTestCase(TestCase):
    def test_decide_xref(self):
        w = self.create_user("user")
        coll = self.create_collection()
        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "a2",
            "match_collection_id": coll.id,
        }
        profile_t1 = decide_xref(xref, judgement=Judgement.POSITIVE, authz=w)
        assert profile_t1.collection_id == coll.id, profile_t1
        assert len(profile_t1.items().all()) == 2, profile_t1
        assert all(
            e.judgement == Judgement.POSITIVE and e.entity_id in ("a1", "a2")
            for e in profile_t1.items()
        )

        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "b1",
            "match_collection_id": coll.id,
        }
        profile_t2 = decide_xref(xref, judgement=Judgement.NEGATIVE, authz=w)
        assert profile_t1.id == profile_t2.id, (profile_t1, profile_t2)
        assert len(profile_t2.items().all()) == 3, profile_t2
        assert all(
            e.judgement == Judgement.POSITIVE
            if e.entity_id.startswith("a")
            else Judgement.NEGATIVE
            for e in profile_t2.items()
        )

        xref = {
            "entity_id": "b1",
            "collection_id": coll.id,
            "match_id": "b2",
            "match_collection_id": coll.id,
        }
        profile_t3 = decide_xref(xref, judgement=Judgement.NEGATIVE, authz=w)
        assert profile_t1.id != profile_t3.id != profile_t2.id

        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "b1",
            "match_collection_id": coll.id,
        }
        profile_t4 = decide_xref(xref, judgement=Judgement.UNSURE, authz=w)
        assert profile_t4.id == profile_t2.id

    def test_collection_profiles(self):
        w = self.create_user("user")
        coll = self.create_collection()
        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "a2",
            "match_collection_id": coll.id,
        }
        for judgement in Judgement:
            decide_xref(xref, judgement=judgement, authz=w)
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

        decide_xref(xref, judgement=Judgement.NEGATIVE, authz=w)
        result = list(collection_profiles(coll.id, judgements=[Judgement.POSITIVE]))
        assert len(result) == 1, len(result)
        profile, items = result[0]
        assert len(items) == 1
        assert items[0].entity_id == "a1"
