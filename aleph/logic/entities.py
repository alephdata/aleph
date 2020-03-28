import logging
from pprint import pformat  # noqa

from followthemoney import model
from followthemoney.types import registry

from aleph.core import db, cache
from aleph.model import Entity, Document
from aleph.index import entities as index
from aleph.logic.notifications import flush_notifications
from aleph.logic.collections import refresh_collection
from aleph.index import xref as xref_index
from aleph.logic.aggregator import delete_aggregator_entity
from aleph.logic.graph import (
    AlephGraph, EntityGraph
)

log = logging.getLogger(__name__)


def upsert_entity(data, collection, validate=True, sync=False):
    """Create or update an entity in the database. This has a side hustle
    of migrating entities created via the _bulk API or a mapper to a
    database entity in the event that it gets edited by the user.
    """
    entity = None
    entity_id = collection.ns.sign(data.get('id'))
    if entity_id is not None:
        entity = Entity.by_id(entity_id,
                              collection=collection,
                              deleted=True)
    # TODO: migrate softly from index.
    if entity is None:
        entity = Entity.create(data, collection, validate=validate)
    else:
        entity.update(data, collection, validate=validate)
    collection.touch()
    db.session.commit()
    delete_aggregator_entity(collection, entity.id)
    index.index_entity(entity, sync=sync)
    refresh_entity(entity.id, sync=sync)
    refresh_collection(collection.id, sync=sync)
    return entity.id


def refresh_entity(entity_id, sync=False):
    if sync:
        cache.kv.delete(cache.object_key(Entity, entity_id))


def delete_entity(collection, entity, deleted_at=None, sync=False):
    # This is recursive and will also delete any entities which
    # reference the given entity. Usually this is going to be child
    # documents, or directoships referencing a person. It's a pretty
    # dangerous operation, though.
    entity_id = collection.ns.sign(entity.get('id'))
    for adjacent in index.iter_adjacent(entity):
        log.warning("Recursive delete: %r", adjacent)
        delete_entity(collection, adjacent, deleted_at=deleted_at, sync=sync)
    flush_notifications(entity_id, clazz=Entity)
    obj = Entity.by_id(entity_id, collection=collection)
    if obj is not None:
        obj.delete(deleted_at=deleted_at)
    doc = Document.by_id(entity_id, collection=collection)
    if doc is not None:
        doc.delete(deleted_at=deleted_at)
    index.delete_entity(entity_id, sync=sync)
    xref_index.delete_xref(collection, entity_id=entity_id, sync=sync)
    delete_aggregator_entity(collection, entity_id)
    refresh_entity(entity_id, sync=sync)
    refresh_collection(collection.id, sync=sync)


def entity_references(entity, authz=None):
    """Given a particular entity, find all the references to it from other
    entities, grouped by the property where they are used."""
    proxy = model.get_proxy(entity)
    graph = EntityGraph(proxy, authz=authz)
    return graph.get_references()


def entity_tags(entity, authz=None):
    """Do a search on tags of an entity."""
    proxy = model.get_proxy(entity)
    edge_types = [registry.name, registry.email, registry.identifier,
                  registry.iban, registry.phone, registry.address]
    graph = EntityGraph(proxy, edge_types=edge_types, authz=authz)
    return graph.get_tags()


def entity_expand_properties(entity, collection_ids, edge_types,
                             properties=None, include_entities=False,
                             authz=None):
    """Get the adjacent entities of an entity linked directly by a property
    or common property value (eg: having the same email or phone number)

    collection_ids: list of collection_ids to search
    edge_types: list of FtM Types to expand as edges
    properties: list of FtM Properties to expand as edges.
    include_entities: If False, only counts are returned
    """
    proxy = model.get_proxy(entity)
    graph = EntityGraph(
        proxy, edge_types=edge_types, included_properties=properties,
        authz=authz, collection_ids=collection_ids,
        include_entities=include_entities
    )
    return graph.expand_entity()


def enitiy_expand_adjacent_nodes(entity, collection_ids, edge_types,
                                 properties=None, authz=None):
    """Expand an entity's graph to find adjacent entities that are connected
    by a common property value, a property or an Entity type edge. (eg: Person
    connected to Company through Directorship)"""
    graph = AlephGraph(edge_types=edge_types)
    source_proxy = model.get_proxy(entity)
    graph.add(source_proxy)
    for prop, total, entities in entity_expand_properties(
        entity, collection_ids, edge_types, properties=properties,
        include_entities=True, authz=authz
    ):
        for ent in entities:
            proxy = model.get_proxy(ent)
            graph.add(proxy)
    graph.resolve()
    return graph.get_adjacent_entities(source_proxy)
