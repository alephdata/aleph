# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import logging

from aleph.core import cache
from aleph.model import EntitySet, EntitySetItem, Events
from aleph.logic.entities import upsert_entity, refresh_entity
from aleph.logic.collections import index_aggregator
from aleph.logic.aggregator import get_aggregator
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def get_entityset(entityset_id):
    return EntitySet.by_id(entityset_id)


def refresh_entityset(entityset_id):
    cache.kv.delete(cache.object_key(EntitySet, entityset_id))


def create_entityset(collection, data, authz):
    """Create an entity set. This will create or update any entities
    that already exist in the entityset and sign their IDs into the collection.
    """
    old_to_new_id_map = {}
    entity_ids = []
    for entity in data.pop("entities", []):
        old_id = entity.get("id")
        new_id = upsert_entity(entity, collection, sign=True, sync=True)
        old_to_new_id_map[old_id] = new_id
        entity_ids.append(new_id)
    layout = data.get("layout", {})
    data["layout"] = replace_layout_ids(layout, old_to_new_id_map)
    entityset = EntitySet.create(data, collection, authz)
    for entity_id in entity_ids:
        save_entityset_item(entityset, collection, entity_id)
    publish(
        Events.CREATE_ENTITYSET,
        params={"collection": collection, "entityset": entityset},
        channels=[collection, authz.role],
        actor_id=authz.id,
    )
    return entityset


def save_entityset_item(entityset, collection, entity_id, **data):
    """Change the association between an entity and an entityset. In the case of
    a profile, this may require re-indexing of the entity to update the associated
    profile_id.
    """
    item = EntitySetItem.save(entityset, entity_id, collection_id=collection.id, **data)
    if entityset.type == EntitySet.PROFILE and entityset.collection_id == collection.id:
        from aleph.logic.profiles import profile_fragments

        aggregator = get_aggregator(collection)
        profile_fragments(collection, aggregator, entity_id=entity_id)
        index_aggregator(collection, aggregator, entity_ids=[entity_id])
        refresh_entity(collection, entity_id)
    collection.touch()
    refresh_entityset(entityset.id)
    return item


def replace_layout_ids(layout, old_to_new_id_map):
    # Replace ids in vertices
    for vtx in layout.get("vertices", []):
        ent_id = vtx.get("entityId")
        if ent_id in old_to_new_id_map:
            new_id = old_to_new_id_map[ent_id]
            vtx["entityId"] = new_id
            vtx["id"] = vtx["id"].replace(ent_id, new_id)
    # Replaces ids in edges
    for edge in layout.get("edges", []):
        for key in ("sourceId", "targetId"):
            if edge[key].startswith("entity"):
                old_id = edge[key].split("entity:")[-1]
                if old_id in old_to_new_id_map:
                    new_id = old_to_new_id_map[old_id]
                    edge[key] = "entity:%s" % new_id
                    edge["id"] = edge["id"].replace(old_id, new_id)
        ent_id = edge.get("entityId")
        if ent_id in old_to_new_id_map:
            new_id = old_to_new_id_map[ent_id]
            edge["entityId"] = new_id
            edge["id"] = edge["id"].replace(ent_id, new_id)
    # Replace ids in groupings
    for group in layout.get("groupings", []):
        vertices = []
        for vtx in group.get("vertices", []):
            if vtx.startswith("entity"):
                old_id = vtx.split("entity:")[-1]
                if old_id in old_to_new_id_map:
                    new_id = old_to_new_id_map[old_id]
                    group["id"] = group["id"].replace(old_id, new_id)
                    vtx = "entity:%s" % new_id
            vertices.append(vtx)
        group["vertices"] = vertices
    return layout
