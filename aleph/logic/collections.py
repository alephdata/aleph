import logging
from datetime import datetime

from aleph.core import db, celery
from aleph.ingest import ingest
from aleph.model import Collection, Document, Entity, Match, Permission
from aleph.index.collections import delete_collection as index_delete
from aleph.index.collections import index_collection
from aleph.logic.entities import delete_entity, update_entity_full
from aleph.logic.documents import delete_document
from aleph.logic.util import ui_url

log = logging.getLogger(__name__)


def collection_url(collection_id=None, **query):
    return ui_url('collections', id=collection_id, **query)


def update_collection(collection):
    """Create or update a collection."""
    if collection.deleted_at is not None:
        index_delete(collection.id)
        return

    log.info("Updating: %r", collection)
    index_collection(collection)


@celery.task()
def process_collection(collection_id):
    """Re-analyze the elements of this collection, documents and entities."""
    q = db.session.query(Collection).filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)

    # re-process the documents
    q = db.session.query(Document)
    q = q.filter(Document.collection_id == collection_id)
    q = q.filter(Document.parent_id == None)  # noqa
    for document in q.yield_per(5000):
        ingest.delay(document.id)

    # re-process entities
    q = db.session.query(Entity)
    q = q.filter(Entity.collection_id == collection.id)
    for entity in q.yield_per(5000):
        update_entity_full(entity.id)

    update_collection(collection)


@celery.task()
def delete_collection(collection_id):
    # Deleting a collection affects many associated objects and requires
    # checks, so this is done manually and in detail here.
    q = db.session.query(Collection)
    q = q.filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)
        return

    log.info("Deleting collection [%r]: %r", collection.id, collection.label)
    deleted_at = datetime.utcnow()
    index_delete(collection_id)

    log.info("Delete cross-referencing matches...")
    Match.delete_by_collection(collection_id)

    log.info("Delete permissions...")
    Permission.delete_by_collection(collection_id, deleted_at=deleted_at)

    log.info("Delete documents...")
    Document.delete_by_collection(collection_id, deleted_at=deleted_at)

    log.info("Delete entities...")
    Entity.delete_by_collection(collection_id, deleted_at=deleted_at)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()


def cleanup_collections():
    """Reindex collections periodically."""
    for collection in Collection.all():
        update_collection(collection)
