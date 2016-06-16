import logging
from datetime import datetime

from aleph.core import db, celery
from aleph.model import Collection
from aleph.index import index_document, delete_document
from aleph.index.collections import delete_collection as index_delete
from aleph.logic.entities import reindex_entity

log = logging.getLogger(__name__)


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
            entity.delete(deleted_at=deleted_at)
        reindex_entity(entity)

    for document in collection.documents:
        document.collections = [c for c in document.collections
                                if c.id != collection.id]
        if not len(document.collections):
            document.delete(deleted_at=deleted_at)
            delete_document(document.id)
        else:
            db.session.add(document)
            index_document(document.id)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()
    index_delete(collection_id)
