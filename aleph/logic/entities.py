from __future__ import absolute_import

import logging
from followthemoney import model
from followthemoney.util import merge_data

from aleph.core import es, db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Collection, Entity, Alert, Role, Permission
from aleph.index import index_entity, flush_index
from aleph.index.core import entities_index
from aleph.index.entities import index_bulk
from aleph.index.collections import index_collection
from aleph.index.util import authz_query
from aleph.logic.util import ui_url
from aleph.util import dict_list

log = logging.getLogger(__name__)
BULK_PAGE = 500


def entity_url(entity_id=None, **query):
    return ui_url('entities', id=entity_id, **query)


def update_entity(entity):
    index_entity(entity)
    update_entity_full.apply_async([entity.id],
                                   queue=USER_QUEUE,
                                   routing_key=USER_ROUTING_KEY)
    # needed to make the call to view() work:
    flush_index()


def delete_entity(entity, deleted_at=None):
    entity.delete(deleted_at=deleted_at)
    update_entity_full(entity.id)


@celery.task()
def update_entity_full(entity_id):
    """Perform update operations on entities."""
    query = db.session.query(Entity).filter(Entity.id == entity_id)
    entity = query.first()
    if entity is None:
        log.error("No entity with ID: %r", entity_id)
        return
    Alert.dedupe(entity.id)
    index_entity(entity)
    # xref_item(item)


@celery.task()
def reindex_entities(block=5000):
    cq = db.session.query(Collection)
    for collection in cq.yield_per(block):
        log.info("Indexing entities in: %r", collection)
        eq = db.session.query(Entity)
        eq = eq.filter(Entity.collection_id == collection.id)
        for entity in eq.yield_per(block):
            # Use the one that's already loaded:
            entity.collection = collection
            index_entity(entity)
        index_collection(collection)


def bulk_load(config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    for foreign_id, data in config.items():
        collection = Collection.by_foreign_id(foreign_id)
        if collection is None:
            collection = Collection.create({
                'foreign_id': foreign_id,
                'label': data.get('label') or foreign_id,
                'summary': data.get('summary'),
                'category': data.get('category'),
                'managed': True,
            })

        for role_fk in dict_list(data, 'roles', 'role'):
            role = Role.by_foreign_id(role_fk)
            if role is not None:
                Permission.grant(collection, role, True, False)
            else:
                log.warning("Could not find role: %s", role_fk)

        db.session.commit()
        index_collection(collection)

        for query in dict_list(data, 'queries', 'query'):
            bulk_load_query(collection, query)


def bulk_load_query(collection, query):
    mapping = model.make_mapping(query, key_prefix=collection.foreign_id)
    entities = {}
    total = 0
    for idx, record in enumerate(mapping.source.records, 1):
        for entity in mapping.map(record).values():
            entity_id = entity.get('id')
            if entity_id is None:
                continue
            # When loading from a tabular data source, we will often
            # encounter mappings where the same entity is emitted
            # multiple times in short sequence, e.g. when the data
            # describes all the directors of a single company.
            base = entities.get(entity_id, {})
            entities[entity_id] = merge_data(entity, base)
            total += 1

        if idx % 1000 == 0:
            log.info("[%s] Loaded %s records, %s entities...",
                     collection.foreign_id, idx, total)

        if len(entities) >= BULK_PAGE:
            index_bulk(collection, entities, chunk_size=BULK_PAGE)
            entities = {}

    if len(entities):
        index_bulk(collection, entities, chunk_size=BULK_PAGE)

    # Update collection stats
    index_collection(collection)


def entity_references(entity, authz):
    """Given a particular entity, find all the references to it from other
    entities, grouped by the property where they are used."""
    schema = model[entity.get('schema')]

    # Generate all the possible mention locations.
    properties = []
    queries = []
    for prop in model.properties:
        if not prop.is_entity:
            continue
        if not schema.is_a(prop.range):
            continue

        field = 'properties.%s' % prop.name
        queries.append({})
        queries.append({
            'size': 0,
            'query': {
                'bool': {
                    'filter': [
                        authz_query(authz),
                        {'term': {'schemata': prop.schema.name}},
                        {'term': {field: entity.get('id')}},
                    ]
                }
            }
        })
        properties.append(prop)

    # Run a count search (with schema facet?)
    res = es.msearch(index=entities_index(), body=queries)
    results = []
    for prop, resp in zip(properties, res.get('responses', [])):
        total = resp.get('hits', {}).get('total')
        if total > 0:
            results.append({
                'count': total,
                'property': prop,
                'schema': prop.schema.name
            })
    return results


def entity_pivot(entity, authz):
    """Do a search on tags of an entity."""
    # NOTE: This must also work for documents.
    FIELDS = [
        'names',
        'emails',
        'phones',
        'addresses',
        'identifiers'
    ]
    pivots = []
    queries = []
    # Go through all the tags which apply to this entity, and find how
    # often they've been mentioned in other entities.
    for field in FIELDS:
        for value in entity.get(field, []):
            queries.append({})
            queries.append({
                'size': 0,
                'query': {
                    'bool': {
                        'filter': [
                            authz_query(authz),
                            {'term': {field: value}},
                        ],
                        'must_not': [
                            {'ids': {'values': [entity.get('id')]}},
                        ]
                    }
                }
            })
            pivots.append((field, value))

    if not len(queries):
        return []

    res = es.msearch(index=entities_index(), body=queries)
    results = []
    for (field, value), resp in zip(pivots, res.get('responses', [])):
        total = resp.get('hits', {}).get('total')
        if total > 0:
            results.append({
                'value': value,
                'field': field,
                'count': total
            })

    results.sort(key=lambda p: p['count'], reverse=True)
    return results
