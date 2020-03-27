import logging
from pprint import pformat  # noqa

from followthemoney import model
from followthemoney.types import registry

from aleph.core import db, cache
from aleph.model import Entity, Document
from aleph.index import entities as index
from aleph.logic.notifications import flush_notifications
from aleph.logic.collections import refresh_collection
from aleph.index.indexes import entities_read_index
from aleph.index import xref as xref_index
from aleph.index.entities import get_entity
from aleph.logic.aggregator import delete_aggregator_entity
from aleph.logic.graph import (
    AlephGraph, GraphSegmentQuery, GraphSegmentResponse
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
    schema = model.get(entity.get('schema'))
    query = GraphSegmentQuery()
    for prop in model.properties:
        if prop.type != registry.entity:
            continue
        if not schema.is_a(prop.range):
            continue

        index = entities_read_index(prop.schema)
        field = 'properties.%s' % prop.name
        value = entity.get('id')
        query.add_facet(
            (index, prop.qname, registry.entity.group, field, value)
        )

    res = query.query(authz=authz, include_entities=False)
    return res.iter_prop_counts()


def entity_tags(entity, authz=None):
    """Do a search on tags of an entity."""
    proxy = model.get_proxy(entity)
    Thing = model.get(Entity.THING)
    types = [registry.name, registry.email, registry.identifier,
             registry.iban, registry.phone, registry.address]
    query = GraphSegmentQuery()
    # Go through all the tags which apply to this entity, and find how
    # often they've been mentioned in other entities.
    for type_ in types:
        if type_.group is None:
            continue
        for fidx, value in enumerate(proxy.get_type_values(type_)):
            if type_.specificity(value) < 0.1:
                continue
            schemata = model.get_type_schemata(type_)
            schemata = [s for s in schemata if s.is_a(Thing)]
            index = entities_read_index(schemata)
            alias = '%s_%s' % (type_.name, fidx)
            query.add_facet((index, alias, type_.group, type_.group, value))

    res = query.query(authz=authz, include_entities=False)
    for (_, alias, field, _, value) in query.facets:
        total = res.get_count(alias)
        if total > 1:
            yield (field, value, total)


def entity_expand_nodes(entity, collection_ids, edge_types, properties=None, include_entities=False, authz=None):  # noqa
    proxy = model.get_proxy(entity)
    schema = proxy.schema
    reversed_properties = []
    literal_value_properties = []
    matchable_prop_types = [t for t in registry.get_types(edge_types) if t.matchable]  # noqa
    graph_response = GraphSegmentResponse()
    query = GraphSegmentQuery(response=graph_response)
    for prop in model.properties:
        # Check if we're expanding all properties or a limited list of props
        if properties and prop.qname not in properties:
            continue
        value = None
        if schema.is_a(prop.schema):
            if prop.stub is True:
                # generated stub reverse property
                prop = prop.reverse
                value = proxy.id
                index = entities_read_index(prop.schema)
                field = 'properties.%s' % prop.name
                query.add_facet((index, prop.qname, registry.entity.group, field, value))  # noqa
                reversed_properties.append(prop.qname)
            else:
                # direct property
                if prop.type == registry.entity:
                    values = proxy.get(prop.name)
                    total = len(values)
                    if total > 0:
                        if include_entities:
                            entities = [get_entity(val) for val in values]
                            graph_response.set_entities(prop.qname, entities)
                        graph_response.set_count(prop.qname, total)
                elif prop.type in matchable_prop_types:
                    # literal value matches
                    values = proxy.get(prop.name)
                    index = entities_read_index(prop.schema)
                    field = 'properties.%s' % prop.name
                    literal_value_properties.append(prop.qname)
                    for val in values:
                        query.add_facet((index, prop.qname, prop.type.group, field, val))  # noqa

    res = query.query(
        collection_ids=collection_ids, authz=authz,
        include_entities=include_entities
    )
    res.reverse_property(reversed_properties)
    res.ignore_source(literal_value_properties, proxy.id)

    return res.iter_props(include_entities=include_entities)


def expand_entity_graph(entity, collection_ids, edge_types, properties=None, authz=None):  # noqa
    graph = AlephGraph(edge_types=edge_types)
    source_proxy = model.get_proxy(entity)
    graph.add(source_proxy)
    for prop, total, entities in entity_expand_nodes(
        entity, collection_ids, edge_types, properties=properties,
        include_entities=True, authz=authz
    ):
        for ent in entities:
            proxy = model.get_proxy(ent)
            graph.add(proxy)
    graph.resolve()
    return graph.get_adjacent_entities(source_proxy)
