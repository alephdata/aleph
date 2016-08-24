import logging
from datetime import datetime

from aleph import graph
from aleph.core import db, celery
from aleph.model import Collection
from aleph.index.collections import delete_collection as index_delete
from aleph.analyze import analyze_documents
from aleph.logic.entities import update_entity, delete_entity
from aleph.logic.entities import update_entity_full
from aleph.logic.documents import update_document, delete_document

log = logging.getLogger(__name__)


def update_collection(collection):
    """Create or update a collection."""
    with graph.transaction() as tx:
        graph.load_collection(tx, collection)


@celery.task()
def analyze_collection(collection_id):
    """Re-analyze the elements of this collection, documents and entities."""
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
def delete_collection(collection_id=None):
    # Deleting a collection affects many associated objects and requires
    # checks, so this is done manually and in detail here.
    q = db.session.query(Collection).filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)

    log.info("Deleting collection [%r]: %r", collection.id, collection.label)
    deleted_at = datetime.utcnow()
    for entity in collection.entities:
        entity.collections = [c for c in entity.collections
                              if c.id != collection.id]
        db.session.add(entity)
        if not len(entity.collections):
            delete_entity(entity)
        else:
            update_entity(entity)

    for document in collection.documents:
        document.collections = [c for c in document.collections
                                if c.id != collection.id]
        if not len(document.collections):
            delete_document(document, deleted_at=deleted_at)
        else:
            if collection_id == document.source_collection_id:
                document.source_collection_id = None
            db.session.add(document)
            update_document(document)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()
    index_delete(collection_id)
    with graph.transaction() as tx:
        graph.remove_collection(tx, collection_id)
