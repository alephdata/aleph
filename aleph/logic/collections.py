import logging
from datetime import datetime

from aleph.core import db, celery
from aleph.ingest import ingest
from aleph.model import Collection, Document, Entity
from aleph.index.collections import delete_collection as index_delete
from aleph.index.collections import index_collection
from aleph.logic.entities import delete_entity, update_entity_full
from aleph.logic.documents import delete_document

log = logging.getLogger(__name__)


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
    for document in q:
        ingest.delay(document.id)

    # re-process entities
    for entity in collection.entities:
        update_entity_full(entity.id)

    update_collection(collection)


@celery.task()
def delete_collection(collection_id):
    # Deleting a collection affects many associated objects and requires
    # checks, so this is done manually and in detail here.
    q = db.session.query(Collection).filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)
        return

    log.info("Deleting collection [%r]: %r", collection.id, collection.label)
    index_delete(collection_id)
    deleted_at = datetime.utcnow()

    q = db.session.query(Entity)
    q = q.filter(Entity.collection_id == collection.id)
    for entity in q.yield_per(5000):
        # TODO: consider hard-deleting entities because the polyglot tagger
        # cannot tell if a deleted match on a tagged term on a revived
        # collection means not to tag this entity any more.
        log.info("Delete entity: %r", entity)
        delete_entity(entity, deleted_at=deleted_at)

    q = db.session.query(Document)
    q = q.filter(Document.collection_id == collection.id)
    for document in q.yield_per(5000):
        log.info("Delete document: %r", document)
        delete_document(document, deleted_at=deleted_at)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()
