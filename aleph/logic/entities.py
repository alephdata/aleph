import logging
from followthemoney import model
from followthemoney.types import registry

from aleph.core import es, db, cache
from aleph.model import Entity, Document
from aleph.index import entities as index
from aleph.logic.notifications import flush_notifications
from aleph.logic.collections import refresh_collection
from aleph.index.indexes import entities_read_index
from aleph.index import xref as xref_index
from aleph.index.util import unpack_result
from aleph.index.entities import get_entity
from aleph.logic.aggregator import delete_aggregator_entity
from aleph.index.util import authz_query, field_filter_query

log = logging.getLogger(__name__)

MAX_EXPAND_NODES_PER_PROPERTY = 20


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
    facets = []
    for prop in model.properties:
        if prop.type != registry.entity:
            continue
        if not schema.is_a(prop.range):
            continue

        index = entities_read_index(prop.schema)
        field = 'properties.%s' % prop.name
        value = entity.get('id')
        facets.append((index, prop.qname, registry.entity.group, field, value))

    res = _filters_faceted_query(facets, authz=authz)
    for (qname, result) in res.items():
        total = result['count']
        if total > 0:
            yield (model.get_qname(qname), total)


def entity_tags(entity, authz=None):
    """Do a search on tags of an entity."""
    proxy = model.get_proxy(entity)
    Thing = model.get(Entity.THING)
    types = [registry.name, registry.email, registry.identifier,
             registry.iban, registry.phone, registry.address]
    facets = []
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
            facets.append((index, alias, type_.group, type_.group, value))

    res = _filters_faceted_query(facets, authz=authz)
    for (_, alias, field, _, value) in facets:
        total = res.get(alias, {}).get('count', 0)
        if total > 1:
            yield (field, value, total)


def entity_expand_nodes(entity, collection_ids, edge_types, properties=None, include_entities=False, authz=None):  # noqa
    proxy = model.get_proxy(entity)
    schema = proxy.schema
    facets = []
    reversed_properties = []
    literal_value_properties = []
    matchable_prop_types = [t for t in registry.get_types(edge_types) if t.matchable]  # noqa
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
                facets.append((index, prop.qname, registry.entity.group, field, value))  # noqa
                reversed_properties.append(prop.qname)
            else:
                # direct property
                if prop.type == registry.entity:
                    values = proxy.get(prop.name)
                    total = len(values)
                    if total > 0:
                        if include_entities:
                            entities = [get_entity(val) for val in values]
                            yield (prop, total, entities)
                        else:
                            yield (prop, total)
                elif prop.type in matchable_prop_types:
                    # literal value matches
                    values = proxy.get(prop.name)
                    index = entities_read_index(prop.schema)
                    field = 'properties.%s' % prop.name
                    literal_value_properties.append(prop.qname)
                    for val in values:
                        facets.append((index, prop.qname, prop.type.group, field, val))  # noqa

    res = _filters_faceted_query(
        facets, collection_ids=collection_ids, authz=authz,
        include_entities=include_entities
    )
    for (qname, result) in res.items():
        total = result.get('count', 0)
        entities = result.get('entities', [])
        if total > 0:
            prop = model.get_qname(qname)
            if qname in reversed_properties:
                prop = prop.reverse
            if qname in literal_value_properties:
                # the entity we are exapnding on should be removed from matches  # noqa
                total = total - 1
                if total == 0:
                    continue
                entities = [ent for ent in entities if ent['id'] != proxy.id]
            if include_entities:
                yield (prop, total, entities)
            else:
                yield (prop, total)


def _filters_faceted_query(facets, collection_ids=None, authz=None, include_entities=False):  # noqa
    filters = {}
    indexed = {}
    for (idx, alias, group, field, value) in facets:
        indexed[idx] = indexed.get(idx, {})
        indexed[idx][alias] = field_filter_query(field, value)
        filters[idx] = filters.get(idx, {})
        filters[idx][group] = filters[idx].get(group, [])
        filters[idx][group].append(value)

    queries = []
    for (idx, facets) in indexed.items():
        shoulds = []
        for field, values in filters[idx].items():
            shoulds.append(field_filter_query(field, values))
        query = []
        if authz is not None:
            query.append(authz_query(authz))
        if collection_ids:
            query.append(field_filter_query('collection_id', collection_ids))
        query = {
            'bool': {
                'should': shoulds,
                'filter': query,
                'minimum_should_match': 1
            }
        }
        for (k, v) in facets.items():
            queries.append({'index': idx})
            aggs = {'counters': {'filters': {'filters': {k: v}}}}
            queries.append({
                'size': MAX_EXPAND_NODES_PER_PROPERTY if include_entities else 0,  # noqa
                'query': query,
                'aggs': aggs
            })

    results = {}
    if not len(queries):
        return results

    res = es.msearch(body=queries)
    for resp in res.get('responses', []):
        aggs = resp.get('aggregations', {}).get('counters', {})
        for alias, value in aggs.get('buckets', {}).items():
            count = value.get('doc_count', results.get(alias, 0))
            results[alias] = {
                'count': count,
            }
            if include_entities:
                entities = []
                hits = resp.get('hits', {}).get('hits', [])
                for doc in hits:
                    entity = unpack_result(doc)
                    if entity is not None:
                        entities.append(entity)
                results[alias]['entities'] = entities
    return results
