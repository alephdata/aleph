import logging
from datetime import datetime

from aleph.core import db, cache, celery
from aleph.authz import Authz
from aleph.model import Collection, Entity, Match
from aleph.model import Role, Permission, Events
from aleph.index import collections as index
from aleph.logic.notifications import publish, flush_notifications

log = logging.getLogger(__name__)


def create_collection(data, role=None, sync=False):
    role = role or Role.load_cli_user()
    created_at = datetime.utcnow()
    collection = Collection.create(data, role=role, created_at=created_at)
    if collection.created_at == created_at:
        publish(Events.CREATE_COLLECTION,
                actor_id=role.id,
                params={'collection': collection})
    db.session.commit()
    Authz.flush()
    refresh_collection(collection.id)
    return index.index_collection(collection, sync=sync)


def update_collection(collection, sync=False):
    """Create or update a collection."""
    Authz.flush()
    refresh_collection(collection.id)
    return index.index_collection(collection, sync=sync)


def refresh_collection(collection_id, sync=False):
    """Operations to execute after updating a collection-related
    domain object. This will refresh stats and re-index."""
    cache.kv.delete(cache.object_key(Collection, collection_id))


def index_collection(collection, entities=False, refresh=False):
    log.info("Index [%s]: %s", collection.id, collection.label)
    if entities and collection.deleted_at is None:
        index_collection_entities.delay(collection_id=collection.id)
    if refresh:
        refresh_collection(collection.id)
    index.index_collection(collection)


def index_collections(entities=False, refresh=False):
    q = Collection.all(deleted=True)
    q = q.order_by(Collection.updated_at.desc())
    for collection in q:
        index_collection(collection, entities=entities, refresh=refresh)


def delete_collection(collection, sync=False):
    flush_notifications(collection)
    collection.delete()
    db.session.commit()
    index.delete_collection(collection.id, sync=sync)
    delete_collection_content.apply_async([collection.id], priority=7)
    refresh_collection(collection.id)
    Authz.flush()


@celery.task()
def delete_collection_content(collection_id):
    # Deleting a collection affects many associated objects and requires
    # checks, so this is done manually and in detail here.
    q = db.session.query(Collection)
    q = q.filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)
        return

    log.info("Deleting collection [%r]: %r", collection.id, collection.label)
    deleted_at = collection.deleted_at or datetime.utcnow()
    Entity.delete_by_collection(collection_id, deleted_at=deleted_at)
    Match.delete_by_collection(collection_id, deleted_at=deleted_at)
    Permission.delete_by_collection(collection_id, deleted_at=deleted_at)
    index.delete_collection(collection_id)
    index.delete_entities(collection_id)
    collection.delete(deleted_at=deleted_at)
    db.session.commit()


@celery.task(priority=1)
def index_collection_entities(collection_id):
    from aleph.index import entities
    collection = Collection.by_id(collection_id)
    if collection is not None:
        entities.index_collection_entities(collection)
    refresh_collection(collection_id)


def delete_bulk_entities(collection_id, deleted_at=None):
    deleted_at = deleted_at or datetime.utcnow()
    log.info("Deleting entities...")
    index.delete_entities(collection_id, bulk_only=True)
    Match.delete_by_collection(collection_id, deleted_at=deleted_at)
