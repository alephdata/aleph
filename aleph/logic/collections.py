import logging
from datetime import datetime

from aleph.core import db, cache
from aleph.authz import Authz
from aleph.queues import cancel_queue
from aleph.model import Collection, Entity, Document, Match
from aleph.model import Role, Permission, Events
from aleph.index import collections as index
from aleph.logic.notifications import publish, flush_notifications
from aleph.logic.aggregator import drop_aggregator

log = logging.getLogger(__name__)


def create_collection(data, role=None, sync=False):
    role = role or Role.load_cli_user()
    created_at = datetime.utcnow()
    collection = Collection.create(data,
                                   creator=role,
                                   created_at=created_at)
    if collection.created_at == created_at:
        publish(Events.CREATE_COLLECTION,
            params={'collection': collection},
            actor_id=role.id)
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


def reset_collection(collection, sync=False):
    """Reset the collection by deleting any derived data."""
    drop_aggregator(collection)
    Match.delete_by_collection(collection.id)
    cancel_queue(collection)
    index.delete_entities(collection.id, sync=sync)
    refresh_collection(collection.id)
    db.session.commit()


def index_collections():
    for collection in Collection.all(deleted=True):
        index.index_collection(collection)


def delete_collection(collection, sync=False):
    reset_collection(collection, sync=False)
    flush_notifications(collection)
    deleted_at = collection.deleted_at or datetime.utcnow()
    Entity.delete_by_collection(collection.id, deleted_at=deleted_at)
    Document.delete_by_collection(collection.id)
    Permission.delete_by_collection(collection.id, deleted_at=deleted_at)
    collection.delete(deleted_at=deleted_at)
    db.session.commit()
    index.delete_collection(collection.id, sync=sync)
    Authz.flush()
