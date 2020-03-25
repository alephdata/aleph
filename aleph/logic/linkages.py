import logging

from aleph.core import db
from aleph.model import Linkage
from aleph.model.common import make_textid

log = logging.getLogger(__name__)


def decide_xref(xref, decision=None, context_id=None, decider_id=None):
    entity_id = xref.get('entity_id')
    collection_id = xref.get('collection_id')
    entity_linkage = Linkage.by_entity(entity_id,
                                       collection_id=collection_id,
                                       context_id=context_id).first()
    match_id = xref.get('match_id')
    match_collection_id = xref.get('match_collection_id')
    match_linkage = Linkage.by_entity(match_id,
                                      collection_id=match_collection_id,
                                      context_id=context_id).first()
    if entity_linkage is None and match_linkage is None:
        profile_id = make_textid()
        Linkage.save(profile_id, entity_id, collection_id, context_id,
                     decision=decision, decider_id=decider_id)
        Linkage.save(profile_id, match_id, match_collection_id, context_id,
                     decision=decision, decider_id=decider_id)
    elif entity_linkage is None and match_linkage is not None:
        Linkage.save(match_linkage.profile_id, entity_id, collection_id,
                     context_id, decision=decision, decider_id=decider_id)
    elif entity_linkage is not None and match_linkage is None:
        Linkage.save(entity_linkage.profile_id, match_id, match_collection_id,
                     context_id, decision=decision, decider_id=decider_id)
    elif entity_linkage is not None and match_linkage is not None:
        pass
        # Linkage.save(entity_linkage.profile_id, match_id, match_collection_id,
        #              context_id, decision=decision, decider_id=decider_id)
        # Linkage.save(match_linkage.profile_id, entity_id, collection_id,
        #              context_id, decision=decision, decider_id=decider_id)
    db.session.commit()
