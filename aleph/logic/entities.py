from __future__ import absolute_import

import logging
from followthemoney import model
from followthemoney.util import merge_data

from aleph.core import db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Collection, Entity, Alert, Role, Permission
from aleph.index import index_entity, flush_index
from aleph.index.entities import get_entity, index_bulk
from aleph.index.collections import index_collection
from aleph.logic.util import ui_url
from aleph.util import dict_list

log = logging.getLogger(__name__)
BULK_PAGE = 500


def fetch_entity(entity_id):
    """Load entities from both the ES index and the database."""
    entity = get_entity(entity_id)
    obj = Entity.by_id(entity_id)
    if obj is not None:
        entity['data'] = obj.data
    return entity, obj


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
        eq = eq.filter(Entity.collection == collection)
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
                'managed': True,
                'label': data.get('label') or foreign_id,
                'summary': data.get('summary'),
                'category': data.get('category'),
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
            if total % 1000 == 0:
                log.info("[%s] Loaded %s records, %s entities...",
                         collection.foreign_id, idx, total)

        if len(entities) >= BULK_PAGE:
            index_bulk(collection, entities, chunk_size=BULK_PAGE)
            entities = {}

    if len(entities):
        index_bulk(collection, entities, chunk_size=BULK_PAGE)

    # Update collection stats
    index_collection(collection)
