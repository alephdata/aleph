from aleph.core import db
from aleph.model import Linkage
from aleph.logic.linkages import decide_xref
from aleph.tests.util import TestCase


class LinkageTestCase(TestCase):
    def test_decide_xref(self):
        w = self.create_user("user")
        coll = self.create_collection()
        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "a2",
            "match_collection_id": coll.id,
        }
        decide_xref(xref, decision=True, context_id=w.id, decider_id=w.id)
        linkages = list(Linkage.all())
        assert len(linkages) == 2, linkages
        assert linkages[0].profile_id == linkages[1].profile_id, linkages

        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "b1",
            "match_collection_id": coll.id,
        }
        decide_xref(xref, decision=False, context_id=w.id, decider_id=w.id)
        linkages = list(Linkage.all())
        assert len(linkages) == 3, linkages
        profiles = db.session.query(Linkage.profile_id.distinct()).count()
        assert profiles == 1, profiles

        xref = {
            "entity_id": "b1",
            "collection_id": coll.id,
            "match_id": "b2",
            "match_collection_id": coll.id,
        }
        decide_xref(xref, decision=True, context_id=w.id, decider_id=w.id)
        profiles = db.session.query(Linkage.profile_id.distinct()).count()
        assert profiles == 2, profiles

        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "b1",
            "match_collection_id": coll.id,
        }
        decide_xref(xref, decision=True, context_id=w.id, decider_id=w.id)
        profiles = db.session.query(Linkage.profile_id.distinct()).count()
        assert profiles == 1, profiles

    def test_change_xref(self):
        w = self.create_user("user")
        coll = self.create_collection()
        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "a2",
            "match_collection_id": coll.id,
        }
        decide_xref(xref, decision=True, context_id=w.id, decider_id=w.id)
        linkages = list(Linkage.all())
        assert len(linkages) == 2, linkages
        assert linkages[0].profile_id == linkages[1].profile_id, linkages
        assert linkages[0].decision == linkages[1].decision, linkages

        xref = {
            "entity_id": "a1",
            "collection_id": coll.id,
            "match_id": "a2",
            "match_collection_id": coll.id,
        }
        decide_xref(xref, decision=False, context_id=w.id, decider_id=w.id)
        linkages = list(Linkage.all())
        assert len(linkages) == 2, linkages
        assert linkages[0].decision != linkages[1].decision, linkages
