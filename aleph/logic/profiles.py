# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

"""
Profiles are a type of entity set that expresses the notion that several entities
(often from different collections) refer to the same real-world thing.

A special case exists where an entity is positively associated with a profle in
its own collection: this then becomes its "primary" profile. This means that an
entity can only be positively linked to one profile in its own collection, adding
it to a second would merge both profiles.

In the UI, a primary profile is shown instead of the original entity whereever
available. In order to render profiles in a view similar to entities, some of the
APIs designed for entities have to be re-implemented for profiles.

Outside of its own collection, any entity can be linked to any number of profiles.
"""
import logging
from sqlalchemy import or_
from sqlalchemy.orm import aliased
from followthemoney import model
from followthemoney.helpers import name_entity

from aleph.core import db, cache
from aleph.logic.entitysets import get_entityset
from aleph.logic import resolver
from aleph.logic.entitysets import save_entityset_item
from aleph.model import Entity, EntitySet, EntitySetItem, Judgement
from aleph.util import Stub

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
        if entityset is None:
            return
        data = entityset.to_dict()
        data["items"] = []
        for item in entityset.items():
            data["items"].append(item.to_dict())
        cache.set_complex(key, data, expires=cache.EXPIRE)

    # Filter the subset of items the current user can access
    if authz is not None:
        items = [i for i in data["items"] if authz.can(i["collection_id"], authz.READ)]
        data["items"] = items

    # Load the constituent entities for the profile and generate a
    # combined proxy with all of the given properties.
    for item in data["items"]:
        if Judgement(item["judgement"]) == Judgement.POSITIVE:
            resolver.queue(stub, Entity, item.get("entity_id"))
    resolver.resolve(stub)
    merged = None
    data["proxies"] = []
    for item in data["items"]:
        item["entity"] = resolver.get(stub, Entity, item.get("entity_id"))
        if item["entity"] is not None:
            proxy = model.get_proxy(item["entity"])
            proxy.context = {}
            data["proxies"].append(proxy)
            if merged is None:
                merged = proxy.clone()
                merged.context["entities"] = [proxy.id]
            else:
                merged.merge(proxy)
                merged.context["entities"].append(proxy.id)

    if merged is None:
        merged = model.make_entity(Entity.LEGAL_ENTITY)

    # Polish it a bit:
    merged.id = data.get("id")
    merged = name_entity(merged)
    data["merged"] = merged
    data["label"] = merged.caption
    data["shallow"] = False
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


def pairwise_judgements(pairs, collection_id):
    left = aliased(EntitySetItem)
    right = aliased(EntitySetItem)

    q = db.session.query(left, right)
    q = q.filter(left.deleted_at == None, right.deleted_at == None)  # noqa
    q = q.filter(EntitySet.collection_id == collection_id)
    q = q.filter(EntitySet.type == EntitySet.PROFILE)
    q = q.filter(EntitySet.id == left.entityset_id)
    q = q.filter(EntitySet.id == right.entityset_id)
    q = q.filter(
        or_(left.judgement == Judgement.POSITIVE, right.judgement == Judgement.POSITIVE)
    )
    q = q.filter(db.tuple_(left.entity_id, right.entity_id).in_(pairs))

    judgements = {}
    for (left, right) in pairs:
        judgements[(left, right)] = Judgement.NO_JUDGEMENT
        judgements[(right, left)] = Judgement.NO_JUDGEMENT

    for (left, right) in q.all():
        judgement = left.judgement + right.judgement
        judgements[(left.entity_id, right.entity_id)] = judgement
        judgements[(right.entity_id, left.entity_id)] = judgement
    return judgements


def decide_pairwise(collection, entity, match_collection, match, judgement, authz):
    """Store user feedback from an pairwise judgement as an profile-type EntitySet
    The problem here is that we're trying to translate a single pair-wise user
    judgement into a merge or split judgement regarding a cluster of entities.

    This works for most cases, with the exception that a profile, once
    established, cannot be split in a way that preserves what entities
    were linked to what other entities originally."""

    if not isinstance(judgement, Judgement):
        judgement = Judgement(judgement)

    # This will raise a InvalidData error if the two types are not compatible
    model.common_schema(entity.get("schema"), match.get("schema"))

    profile = EntitySet.by_entity_id(
        entity.get("id"),
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
            entity.get("id"),
            judgement=Judgement.POSITIVE,
            added_by_id=authz.id,
        )
    item = save_entityset_item(
        profile,
        match_collection,
        match.get("id"),
        judgement=judgement,
        compared_to_entity_id=entity.get("id"),
        added_by_id=authz.id,
    )
    db.session.commit()

    if item is not None:
        return item.entityset
