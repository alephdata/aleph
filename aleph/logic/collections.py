import logging
from datetime import datetime

from aleph.core import db, cache
from aleph.authz import Authz
from aleph.queues import cancel_queue, ingest_entity
from aleph.queues import queue_task, OP_INDEX
from aleph.model import Collection, Entity, Document, Diagram, Mapping
from aleph.model import Permission, Events
from aleph.index import collections as index
from aleph.index import xref as xref_index
from aleph.logic.notifications import publish, flush_notifications
from aleph.logic.aggregator import get_aggregator, drop_aggregator

log = logging.getLogger(__name__)


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
    refresh_collection(collection.id, sync=sync)
    return index.index_collection(collection, sync=sync)


def refresh_collection(collection_id, sync=True):
    """Operations to execute after updating a collection-related
    domain object. This will refresh stats and flush cache."""
    if collection_id is None:
        return
    keys = [
        cache.object_key(Collection, collection_id),
        cache.object_key(Collection, collection_id, 'stats')
    ]
    if sync:
        keys.append(cache.object_key(Collection, collection_id, 'schema'))
    cache.kv.delete(*keys)


def compute_collection(collection, sync=False):
    key = cache.object_key(Collection, collection.id, 'stats')
    if cache.get(key) and not sync:
        return
    cache.set(key, 'computed', expires=cache.EXPIRE - 60)
    log.info("Collection [%s] changed, computing...", collection.id)
    index.update_collection_stats(collection.id)
    index.index_collection(collection, sync=sync)


def process_collection(stage, collection, ingest=True, sync=False):
    """Trigger a full re-parse of all documents and re-build the
    search index from the aggregator."""
    def _proxies(collection):
        for entity in Entity.by_collection(collection.id).yield_per(5000):
            yield entity.to_proxy()
        for document in Document.by_collection(collection.id).yield_per(5000):
            yield document.to_proxy()

    aggregator = get_aggregator(collection)
    for proxy in _proxies(collection):
        if ingest and proxy.schema.is_a(Document.SCHEMA):
            ingest_entity(collection, proxy,
                          job_id=stage.job.id,
                          sync=sync)
        else:
            aggregator.put(proxy, fragment='db')
            queue_task(collection, OP_INDEX,
                       job_id=stage.job.id,
                       payload={'entity_ids': [proxy.id]},
                       context={'sync': sync})
    aggregator.close()


def reset_collection(collection, sync=False):
    """Reset the collection by deleting any derived data."""
    drop_aggregator(collection)
    cancel_queue(collection)
    flush_notifications(collection, sync=sync)
    index.delete_entities(collection.id, sync=sync)
    xref_index.delete_xref(collection, sync=sync)
    refresh_collection(collection.id, sync=sync)
    db.session.commit()


def index_collections(sync=False):
    for collection in Collection.all(deleted=True):
        compute_collection(collection, sync=sync)


def delete_collection(collection, keep_metadata=False, sync=False):
    reset_collection(collection, sync=False)
    deleted_at = collection.deleted_at or datetime.utcnow()
    Entity.delete_by_collection(collection.id, deleted_at=deleted_at)
    Mapping.delete_by_collection(collection.id, deleted_at=deleted_at)
    Diagram.delete_by_collection(collection.id, deleted_at=deleted_at)
    Document.delete_by_collection(collection.id)
    if not keep_metadata:
        Permission.delete_by_collection(collection.id, deleted_at=deleted_at)
        collection.delete(deleted_at=deleted_at)
    db.session.commit()
    if not keep_metadata:
        index.delete_collection(collection.id, sync=sync)
        Authz.flush()
    refresh_collection(collection.id, sync=True)
