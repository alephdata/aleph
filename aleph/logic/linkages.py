import logging

from aleph.core import db
from aleph.model import Linkage
from aleph.model.common import make_textid

log = logging.getLogger(__name__)


def decide_xref(xref, decision=None, context_id=None, decider_id=None):
    """Store user feedback from an Xref result as a set of entity linkages.
    The problem here is that we're trying to translate a single pair-wise
    user decision into a merge or split decision regarding a cluster of
    entities.

    This works for most cases, with the exception that a profile, once
    established, cannot be split in a way that preserves what entities
    were linked to what other entities originally."""
    entity_id = xref.get('entity_id')
    collection_id = xref.get('collection_id')
    entity_linkage = Linkage.by_entity(entity_id, decision=True,
                                       collection_id=collection_id,
                                       context_id=context_id).first()
    match_id = xref.get('match_id')
    match_collection_id = xref.get('match_collection_id')
    match_linkage = Linkage.by_entity(match_id, decision=True,
                                      collection_id=match_collection_id,
                                      context_id=context_id).first()

    # If we are undecided, and we stay undecided, not much to change.
    if entity_linkage is None or match_linkage is None:
        if decision is None:
            return

    if entity_linkage is None and match_linkage is None:
        # Case 1: Neither entity is linked to a profile, make a new one.
        profile_id = make_textid()
        Linkage.save(profile_id, entity_id, collection_id, context_id,
                     decision=decision, decider_id=decider_id)
        Linkage.save(profile_id, match_id, match_collection_id, context_id,
                     decision=decision, decider_id=decider_id)
    elif entity_linkage is None and match_linkage is not None:
        # Case 2a: One entity is part of a profile, the other isn't.
        # Add the other entity to the existing profile.
        Linkage.save(match_linkage.profile_id, entity_id, collection_id,
                     context_id, decision=decision, decider_id=decider_id)
    elif entity_linkage is not None and match_linkage is None:
        # Case 2b: Like 2a, but the other way around.
        Linkage.save(entity_linkage.profile_id, match_id, match_collection_id,
                     context_id, decision=decision, decider_id=decider_id)
    elif decision is True:
        # Case 3: Both entities are part of profiles. These now need to be
        # merged.
        Linkage.merge(entity_linkage.profile_id, match_linkage.profile_id)
    else:
        # Case 4: Both entities are part of profiles, and have been
        # judged not to be the same. Mark them as distinct.
        Linkage.save(entity_linkage.profile_id, match_id, match_collection_id,
                     context_id, decision=decision, decider_id=decider_id)
        # Case 4b: Splitting an existing profile somewhat randomly.
        if entity_linkage.profile_id != match_linkage.profile_id:
            Linkage.save(match_linkage.profile_id, entity_id, collection_id,
                         context_id, decision=decision, decider_id=decider_id)
    db.session.commit()
