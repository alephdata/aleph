from __future__ import absolute_import

import logging

from aleph.core import db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.model import Collection, Entity, Alert
from aleph.index import index_entity, flush_index
from aleph.index.entities import get_entity
from aleph.index.collections import index_collection
# from aleph.logic.xref import xref_item

log = logging.getLogger(__name__)


def fetch_entity(entity_id):
    """Load entities from both the ES index and the database."""
    entity = get_entity(entity_id)
    obj = Entity.by_id(entity_id)
    if obj is not None:
        entity['data'] = obj.data
    return entity, obj


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
