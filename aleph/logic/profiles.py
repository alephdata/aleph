import logging
from sqlalchemy.orm import aliased
from followthemoney import model
from followthemoney.helpers import name_entity

from aleph.core import db, cache
from aleph.logic.entitysets import get_entityset
from aleph.logic import resolver
from aleph.logic.entitysets import save_entityset_item
from aleph.model import Collection, Entity, EntitySet, EntitySetItem, Judgement
from aleph.util import PairwiseDict, Stub

log = logging.getLogger(__name__)
ORIGIN = "profile"


def get_profile(entityset_id, authz=None):
    """A profile is an entityset having a party. The idea is to cache
    profile metadata for the API, and to generate a merged view of all
    the entities the current user has access to."""
    if entityset_id is None:
        return
    key = cache.object_key(EntitySet, entityset_id)
    data = cache.get_complex(key)
    stub = Stub()
    if data is None:
        entityset = get_entityset(entityset_id)
        data = entityset.to_dict()
        data["items"] = []
        for item in entityset.items():
            data["items"].append(item.to_dict())
        cache.set_complex(key, data, expires=cache.EXPIRE)

    # Filter the subset of items the current user can access
    if authz is not None:
        if not authz.can(data["collection_id"], authz.READ):
            return
        items = [i for i in data["items"] if authz.can(i["collection_id"], authz.READ)]
        data["items"] = items

    # Load the constituent entities for the profile and generate a
    # combined proxy with all of the given properties.
    for item in data["items"]:
        if Judgement(item["judgement"]) == Judgement.POSITIVE:
            resolver.queue(stub, Entity, item.get("entity_id"))
    resolver.resolve(stub)
    merged = None
    for item in data["items"]:
        item["entity"] = resolver.get(stub, Entity, item.get("entity_id"))
        if item["entity"] is not None:
            proxy = model.get_proxy(item["entity"])
            if merged is None:
                merged = proxy
                merged.context["entities"] = [proxy.id]
            else:
                merged.merge(proxy)
                merged.context["entities"].append(proxy.id)

    if merged is None:
        return

    # Polish it a bit:
    merged.id = data.get("id")
    merged = name_entity(merged)
    data["merged"] = merged.to_dict()
    data["label"] = merged.caption
    return data


def profile_fragments(collection, aggregator, entity_id=None):
    """In order to make the profile_id visible on entities in a collection,
    we generate stub entities in the FtM store that contain only a context.
    """
    aggregator.delete(origin=ORIGIN)
    writer = aggregator.bulk()
    profile_id = None
    for (profile_id, entity_id) in EntitySet.all_profiles(
        collection.id, entity_id=entity_id
    ):
        data = {"id": entity_id, "schema": Entity.THING, "profile_id": profile_id}
        writer.put(model.get_proxy(data), origin=ORIGIN)
    writer.flush()
    return profile_id


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
        ((lft.entity_id, rgt.entity_id), (lft.judgement + rgt.judgement))
        for lft, rgt in q.all()
    )


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
    profile = EntitySet.by_entity_id(
        entity_id,
        collection_ids=[collection.id],
        types=[EntitySet.PROFILE],
        judgements=[Judgement.POSITIVE],
    ).first()
    if profile is None:
        data = {"type": EntitySet.PROFILE, "label": "profile"}
        profile = EntitySet.create(data, collection, authz)
    item = save_entityset_item(
        profile,
        collection,
        entity_id,
        judgement=Judgement.POSITIVE,
        added_by_id=authz.id,
    )
    match_id = xref.get("match_id")
    match_collection = Collection.by_id(xref.get("match_collection_id"))
    item = save_entityset_item(
        profile,
        match_collection,
        match_id,
        judgement=judgement,
        compared_to_entity_id=entity_id,
        added_by_id=authz.id,
    )
    db.session.commit()

    if item is not None:
        return item.entityset
