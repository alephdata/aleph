import logging
from datetime import datetime
from servicelayer.jobs import Job

from aleph.core import db, cache
from aleph.authz import Authz
from aleph.queues import cancel_queue, ingest_entity
from aleph.model import Collection, Entity, Document, EntitySet, Mapping
from aleph.model import Permission, Events, Linkage
from aleph.index import collections as index
from aleph.index import xref as xref_index
from aleph.index import entities as entities_index
from aleph.logic.notifications import publish, flush_notifications
from aleph.logic.documents import ingest_flush
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)
MODEL_ORIGIN = 'model'


def create_collection(data, authz, sync=False):
    now = datetime.utcnow()
    collection = Collection.create(data, authz, created_at=now)
    if collection.created_at == now:
        publish(Events.CREATE_COLLECTION,
                params={'collection': collection},
                channels=[collection, authz.role],
                actor_id=authz.id)
    db.session.commit()
    return update_collection(collection, sync=sync)


def update_collection(collection, sync=False):
    """Create or update a collection."""
    Authz.flush()
    refresh_collection(collection.id)
    return index.index_collection(collection, sync=sync)


def refresh_collection(collection_id):
    """Operations to execute after updating a collection-related
    domain object. This will refresh stats and flush cache."""
    cache.kv.delete(cache.object_key(Collection, collection_id),
                    cache.object_key(Collection, collection_id, 'stats'))


def compute_collections():
    for collection in Collection.all():
        compute_collection(collection)


def compute_collection(collection, force=False, sync=False):
    key = cache.object_key(Collection, collection.id, 'stats')
    if cache.get(key) is not None and not force:
        return
    cache.set(key, 'computed', expires=cache.EXPIRE - 60)
    log.info("[%s] Computing statistics...", collection)
    index.update_collection_stats(collection.id)
    index.index_collection(collection, sync=sync)


def aggregate_model(collection, aggregator):
    """Sync up the aggregator from the Aleph domain model."""
    log.debug("[%s] Aggregating model...", collection)
    aggregator.delete(origin=MODEL_ORIGIN)
    writer = aggregator.bulk()
    for document in Document.by_collection(collection.id):
        proxy = document.to_proxy(ns=collection.ns)
        writer.put(proxy, fragment='db', origin=MODEL_ORIGIN)
    for entity in Entity.by_collection(collection.id):
        proxy = entity.to_proxy()
        aggregator.delete(entity_id=proxy.id)
        writer.put(proxy, fragment='db', origin=MODEL_ORIGIN)
    writer.flush()


def index_aggregator(collection, aggregator, entity_ids=None, sync=False):
    def _generate():
        idx = 0
        entities = aggregator.iterate(entity_id=entity_ids)
        for idx, proxy in enumerate(entities):
            if idx > 0 and idx % 1000 == 0:
                log.debug("[%s] Index: %s...", collection, idx)
            yield proxy
        log.debug("[%s] Indexed %s entities", collection, idx)

    entities_index.index_bulk(collection, _generate(), sync=sync)
    aggregator.close()


def reingest_collection(collection, job_id=None, index=False):
    """Trigger a re-ingest for all documents in the collection."""
    job_id = job_id or Job.random_id()
    ingest_flush(collection)
    for document in Document.by_collection(collection.id):
        proxy = document.to_proxy(ns=collection.ns)
        ingest_entity(collection, proxy, job_id=job_id, index=index)


def reindex_collection(collection, sync=False, flush=False):
    """Re-index all entities from the model, mappings and aggregator cache."""
    from aleph.logic.mapping import map_to_aggregator
    if flush:
        log.debug("[%s] Flushing...", collection)
        index.delete_entities(collection.id, sync=True)
    aggregator = get_aggregator(collection)
    for mapping in collection.mappings:
        try:
            map_to_aggregator(collection, mapping, aggregator)
        except Exception as ex:
            # More or less ignore broken models.
            log.warn("Failed mapping [%s]: %s", mapping.id, ex)
    aggregate_model(collection, aggregator)
    index_aggregator(collection, aggregator, sync=sync)
    compute_collection(collection, force=True)


def delete_collection(collection, keep_metadata=False, sync=False):
    cancel_queue(collection)
    aggregator = get_aggregator(collection)
    try:
        aggregator.drop()
    finally:
        aggregator.close()
    flush_notifications(collection, sync=sync)
    index.delete_entities(collection.id, sync=sync)
    xref_index.delete_xref(collection, sync=sync)
    deleted_at = collection.deleted_at or datetime.utcnow()
    Entity.delete_by_collection(collection.id, deleted_at)
    EntitySet.delete_by_collection(collection.id, deleted_at)
    Mapping.delete_by_collection(collection.id, deleted_at)
    Document.delete_by_collection(collection.id)
    if not keep_metadata:
        # Considering linkages metadata for now, might be wrong:
        Linkage.delete_by_collection(collection.id)
        Permission.delete_by_collection(collection.id, deleted_at)
        collection.delete(deleted_at=deleted_at)
    db.session.commit()
    if not keep_metadata:
        index.delete_collection(collection.id, sync=True)
        Authz.flush()
    refresh_collection(collection.id)


def upgrade_collections():
    for collection in Collection.all(deleted=True):
        if collection.deleted_at is not None:
            delete_collection(collection, keep_metadata=True, sync=True)
        else:
            compute_collection(collection, force=True)
