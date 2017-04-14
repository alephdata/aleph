import logging
from datetime import datetime

from aleph.core import db, celery
from aleph.model import Collection, Entity
from aleph.index.collections import delete_collection as index_delete
from aleph.analyze import analyze_documents
from aleph.logic.entities import delete_entity
from aleph.logic.entities import update_entity_full
from aleph.logic.documents import delete_document

log = logging.getLogger(__name__)


def update_collection(collection):
    """Create or update a collection."""
    pass


@celery.task()
def analyze_collection(collection_id):
    """Re-analyze the elements of this collection, documents and entities."""
    Entity.delete_dangling(collection_id)
    db.session.commit()

    q = db.session.query(Collection).filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)

    # re-process the documents
    analyze_documents(collection.id)

    # re-process entities
    for entity in collection.entities:
        update_entity_full(entity.id)


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
    deleted_at = datetime.utcnow()
    for entity in collection.entities:
        # TODO: consider hard-deleting entities because the polyglot tagger
        # cannot tell if a deleted match on a tagged term on a revived
        # collection means not to tag this entity any more.
        log.info("Delete entity: %r", entity)
        delete_entity(entity, deleted_at=deleted_at)

    for document in collection.documents:
        log.info("Delete document: %r", document)
        delete_document(document, deleted_at=deleted_at)

    db.session.refresh(collection)
    collection.delete(deleted_at=deleted_at)
    db.session.commit()
    index_delete(collection_id)
