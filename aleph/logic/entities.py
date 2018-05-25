import logging
from followthemoney import model
from followthemoney.util import merge_data

from aleph.core import es, db, celery
from aleph.model import Collection, Entity
from aleph.index import index_entity
from aleph.index.core import entities_index
from aleph.index.entities import index_bulk
from aleph.index.collections import index_collection
from aleph.index.util import authz_query, field_filter_query
from aleph.util import dict_list

log = logging.getLogger(__name__)
BULK_PAGE = 500


def update_entity(entity):
    update_entity_full.apply_async([entity.id])
    return index_entity(entity)


def delete_entity(entity, deleted_at=None):
    entity.delete(deleted_at=deleted_at)
    update_entity_full(entity.id)


@celery.task(priority=5)
def update_entity_full(entity_id):
    """Perform update operations on entities."""
    query = db.session.query(Entity).filter(Entity.id == entity_id)
    entity = query.first()
    if entity is None:
        return
    index_entity(entity)
    index_collection(entity.collection)


def bulk_load(config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    from aleph.logic.collections import create_collection
    for foreign_id, data in config.items():
        data['label'] = data.get('label', foreign_id)
        collection = create_collection(foreign_id, data)
        for query in dict_list(data, 'queries', 'query'):
            bulk_load_query.apply_async([collection.id, query], priority=6)


@celery.task()
def bulk_load_query(collection_id, query):
    collection = Collection.by_id(collection_id)
    if collection is None:
        log.warning("Collection does not exist: %s", collection_id)
        return

    mapping = model.make_mapping(query, key_prefix=collection.foreign_id)
    records_total = len(mapping.source) or 'streaming'
    entities = {}
    entities_count = 0
    for records_index, record in enumerate(mapping.source.records, 1):
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
            entities_count += 1

        if records_index > 0 and records_index % 1000 == 0:
            log.info("[%s] Loaded %s records (%s), %s entities...",
                     collection.foreign_id,
                     records_index,
                     records_total,
                     entities_count)

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

    if not len(queries):
        return

    # Run a count search (with schema facet?)
    res = es.msearch(index=entities_index(), body=queries)
    for prop, resp in zip(properties, res.get('responses', [])):
        total = resp.get('hits', {}).get('total')
        if total is not None and total > 0:
            yield (prop, total)


def entity_tags(entity, authz):
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
            if value is None or not len(value):
                continue
            queries.append({})
            queries.append({
                'size': 0,
                'query': {
                    'bool': {
                        'filter': [
                            authz_query(authz),
                            field_filter_query(field, value)
                        ],
                        'must_not': [
                            {'ids': {'values': [entity.get('id')]}},
                        ]
                    }
                }
            })
            pivots.append((field, value))

    if not len(queries):
        return

    res = es.msearch(index=entities_index(), body=queries)
    for (field, value), resp in zip(pivots, res.get('responses', [])):
        total = resp.get('hits', {}).get('total')
        if total is not None and total > 0:
            yield (field, value, total)
