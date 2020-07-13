import logging
from itertools import chain
from datetime import datetime

from aleph.util import PairwiseDict
from aleph.core import db
from aleph.model import EntitySet, EntitySetItem, Judgement
from aleph.model.common import make_textid

log = logging.getLogger(__name__)


def collection_profiles(collection_id, judgements=None, most_recent=True):
    if judgements is not None:
        judgements = list(map(Judgement, judgements))
    entity_sets = EntitySet.by_collection_id(collection_id, types=[EntitySet.PROFILE])
    for entity_set in entity_sets:
        items = entity_set.profile(judgements=judgements, most_recent=most_recent)
        if items:
            yield (entity_set, items)


def pairwise_decisions(pairs, collection_id):
    q = EntitySetItem.all()
    q = q.join(EntitySet)
    q = q.filter(EntitySet.collection_id == collection_id)
    # NOTE: Potential optimization is to modify `pairs` to contain all the (a,
    # b) pairs and (b, a) pairs so that we don't need the `db.or_`. This needs
    # profiling and maybe we switch between the two query types depending on
    # the number of pairs being requested.
    q = q.filter(db.or_(
        db.tuple_(EntitySetItem.entity_id, EntitySetItem.compared_to_entity_id).in_(pairs),
        db.tuple_(EntitySetItem.compared_to_entity_id, EntitySetItem.entity_id).in_(pairs)
    ))
    q = q.order_by(EntitySetItem.entity_id, EntitySetItem.compared_to_entity_id, EntitySetItem.updated_at.desc())
    q = q.distinct(EntitySetItem.entity_id, EntitySetItem.compared_to_entity_id)
    q = q.all()
    return PairwiseDict(((esi.entity_id, esi.compared_to_entity_id), esi.judgement) for esi in q)


def profile_add_entities(entityset, entity_id, collection_id, compared_to_entity_id, judgement, authz):
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


def create_profile(collection_id, authz):
    es = EntitySet(
        id=make_textid(),
        type=EntitySet.PROFILE,
        collection_id=collection_id,
        role_id=authz.id,
    )
    db.session.add(es)
    return es


def merge_profiles(*profiles):
    idx = min(range(len(profiles)), key=lambda i: profiles[i].created_at)
    master_profile = profiles[idx]
    for profile in profiles:
        if master_profile.id != profile.id:
            master_profile.take_items_from(profile)
            profile.delete()
    return master_profile


class ProfileGrouper:
    def __init__(self):
        self.groups = []
        self.entityitems = []

    def get_group_idx(self, item):
        for i, group in enumerate(self.groups):
            if item.entity_id in group or item.compared_to_entity_id in group:
                return i
        return None

    def add(self, item):
        i = self.get_group_idx(item)
        log.critical(f"Setting item {item.entity_id} into group {i} with judgement {item.judgement}")
        if item.judgement != Judgement.NEGATIVE:
            self._add_group(i, item)
        self._add_entityid(i, item)

    def _add_group(self, i, item):
        try:
            self.groups[i].update(filter(None, (item.entity_id, item.compared_to_entity_id)))
        except (IndexError, TypeError):
            self.groups.append(set(filter(None, (item.entity_id, item.compared_to_entity_id))))

    def _add_entityid(self, i, item):
        try:
            self.entityitems[i].append(item)
        except (IndexError, TypeError):
            self.entityitems.append([item])

    def __len__(self):
        return len(self.entityitems)

    def items(self):
        return (e.id for eis in self.entityitems for e in eis)

    def item_groups(self):
        return self.entityitems



def consolidate_profile(entityset, authz):
    """Consolidate a profile and split any disconnected subgroups

    Utility function to remove overwritten judgements and split the profile
    into multiple profiles if new negative judgements come in. This is done my
    greedily grouping entries based on the pairwise comparisons done in the
    xref decisions.
    """
    grouper = ProfileGrouper()
    for item in entityset.profile(judgements=[Judgement.POSITIVE, Judgement.NEGATIVE]):
        grouper.add(item)
    log.critical(f"Groups: {grouper.groups}")
    log.critical(f"entityitems: {grouper.entityitems}")
    profiles = [entityset]
    if len(grouper) > 1:
        pq = db.session.query(EntitySetItem)
        pq = pq.filter(EntitySetItem.entityset_id == entityset.id)
        pq = pq.filter(db.not_(EntitySetItem.id.in_(list(grouper.items()))))
        pq.update({EntitySetItem.deleted_at: datetime.utcnow()},
                  synchronize_session=False)
        for items in grouper.item_groups()[1:]:
            profile = create_profile(entityset.collection_id, authz)
            profiles.append(profile)
            for item in items:
                item.entityset_id = profile.id
                db.session.add(item)
        db.session.commit()
    log.critical(f"new profiles: {profiles}")
    return profiles


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
    collection_id = xref.get("collection_id")
    entity_profile = EntitySet.by_entity_id(
        entity_id,
        judgements=[Judgement.POSITIVE],
        collection_id=collection_id,
        types=[EntitySet.PROFILE],
    ).first()

    match_id = xref.get("match_id")
    match_collection_id = xref.get("match_collection_id")
    match_profile = EntitySet.by_entity_id(
        match_id,
        judgements=[Judgement.POSITIVE],
        collection_id=collection_id,
        types=[EntitySet.PROFILE],
    ).first()

    # If we are undecided, and we stay undecided, not much to change.
    if entity_profile is None or match_profile is None:
        if judgement is None:
            return

    if entity_profile is None:
        entity_profile = create_profile(collection_id, authz)
        profile_add_entities(entity_profile, entity_id, collection_id, None, Judgement.POSITIVE, authz)

    if judgement is Judgement.POSITIVE and match_profile is not None:
        # Case 1: both entities have profiles and the match is positive
        profile = merge_profiles(entity_profile, match_profile)
        profile_add_entities(profile, match_id, match_collection_id, entity_id, judgement, authz)
    else:
        # Case 2: any other judgement
        # NOTE: Another case of NEGATIVE judgements triggering a
        # `consolidate_profile` could be useful, however it isn't implemented
        # here so that we don't lose judgements. This however should be
        # strongly considered in order to reverse profile mergers. The question
        # is: what to do with old judgements on a pair when we do this?
        profile_add_entities(entity_profile, match_id, match_collection_id, entity_id, judgement, authz)
    db.session.commit()
    return entity_profile
