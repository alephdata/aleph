import logging
from datetime import datetime
from sqlalchemy.orm import aliased

from aleph.util import PairwiseDict
from aleph.core import db
from aleph.model import Collection, EntitySet, EntitySetItem, Judgement

log = logging.getLogger(__name__)


def collection_profiles(collection_id, judgements=None, deleted=False):
    if judgements is not None:
        judgements = list(map(Judgement, judgements))
    entity_sets = EntitySet.by_collection_id(collection_id, types=[EntitySet.PROFILE])
    for entity_set in entity_sets:
        items = entity_set.profile(judgements=judgements, deleted=deleted).all()
        if items:
            yield (entity_set, items)


def pairwise_decisions(pairs, collection_id):
    left = aliased(EntitySetItem)
    right = aliased(EntitySetItem)

    q = db.session.query(left, right)
    q = q.filter(left.deleted_at == None, right.deleted_at == None)  # noqa
    q = q.filter(EntitySet.collection_id == collection_id)
    q = q.filter(left.entityset_id == right.entityset_id)
    q = q.filter(db.tuple_(left.entity_id, right.entity_id).in_(pairs))
    return PairwiseDict(
        ((l.entity_id, r.entity_id), (l.judgement + r.judgement)) for l, r in q.all()
    )


def profile_add_entities(
    entityset, entity_id, collection_id, compared_to_entity_id, judgement, authz
):
    pq = db.session.query(EntitySetItem)
    pq = pq.filter(EntitySetItem.entityset_id == entityset.id)
    pq = pq.filter(EntitySetItem.entity_id == entity_id)
    pq = pq.filter(EntitySetItem.deleted_at == None)  # noqa
    pq.update({EntitySetItem.deleted_at: datetime.utcnow()}, synchronize_session=False)

    esi = EntitySetItem(
        entityset=entityset,
        entity_id=entity_id,
        compared_to_entity_id=compared_to_entity_id,
        collection_id=collection_id,
        added_by_id=authz.id,
        judgement=judgement,
    )
    db.session.add(esi)
    return esi


def create_profile(collection, authz):
    data = {"type": EntitySet.PROFILE, "label": "profile"}
    return EntitySet.create(data, collection, authz)


def decide_xref(xref, judgement, authz):
    """Store user feedback from an Xref result as an profile-type EntitySet
    The problem here is that we're trying to translate a single pair-wise
    user judgement into a merge or split judgement regarding a cluster of
    entities.

    This works for most cases, with the exception that a profile, once
    established, cannot be split in a way that preserves what entities
    were linked to what other entities originally."""

    if not isinstance(judgement, Judgement):
        judgement = Judgement(judgement)

    entity_id = xref.get("entity_id")
    collection = Collection.by_id(xref.get("collection_id"))
    entity_profile = EntitySet.by_entity_id(
        entity_id,
        judgements=[Judgement.POSITIVE],
        collection_id=collection.id,
        types=[EntitySet.PROFILE],
    ).first()

    match_id = xref.get("match_id")
    match_collection_id = xref.get("match_collection_id")
    match_profile = EntitySet.by_entity_id(
        match_id,
        judgements=[Judgement.POSITIVE],
        collection_id=collection.id,
        types=[EntitySet.PROFILE],
    ).first()

    # If we are undecided, and we stay undecided, not much to change.
    if entity_profile is None or match_profile is None:
        if judgement == Judgement.NO_JUDGEMENT:
            return

    if entity_profile is None:
        entity_profile = create_profile(collection, authz)
        profile_add_entities(
            entity_profile, entity_id, collection.id, None, Judgement.POSITIVE, authz
        )

    if judgement is Judgement.POSITIVE and match_profile is not None:
        # Case 1: both entities have profiles and the match is positive
        entity_profile = entity_profile.merge(match_profile, authz.id)
    else:
        # Case 2: any other judgement
        # NOTE: Another case of NEGATIVE judgements triggering a
        # `split_profile` could be useful, however it isn't implemented
        # here so that we don't lose judgements. This however should be
        # strongly considered in order to reverse profile mergers. The question
        # is: what to do with old judgements on a pair when we do this?
        profile_add_entities(
            entity_profile, match_id, match_collection_id, entity_id, judgement, authz
        )
    db.session.commit()
    return entity_profile
