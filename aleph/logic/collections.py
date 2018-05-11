import logging
from datetime import datetime

from aleph.core import db, celery
from aleph.model import Collection, Document, Entity, Match, Permission
from aleph.index import collections as index
from aleph.logic.entities import update_entity_full
from aleph.logic.xref import xref_collection

log = logging.getLogger(__name__)


def update_collection(collection):
    """Create or update a collection."""
    log.info("Updating: %r", collection)

    if collection.deleted_at is not None:
        index.delete_collection(collection.id)
        return

    if collection.casefile:
        xref_collection.apply_async([collection.id], priority=2)
        # TODO: rebuild dossiers

    eq = db.session.query(Entity.id)
    eq = eq.filter(Entity.collection_id == collection.id)
    for entity in eq:
        update_entity_full.apply_async([entity.id], priority=1)

    return index.index_collection(collection)


def update_collections():
    cq = db.session.query(Collection)
    cq = cq.order_by(Collection.id.desc())
    for collection in cq.all():
        update_collection(collection)


def index_collections():
    cq = db.session.query(Collection)
    cq = cq.order_by(Collection.id.desc())
    for collection in cq.all():
        log.info("Index [%s]: %s", collection.foreign_id, collection.label)
        index.delete_collection(collection.id)
        index.index_collection(collection)


@celery.task(priority=8)
def update_collection_access(collection_id):
    """Re-write all etities in this collection to reflect updated roles."""
    collection = Collection.by_id(collection_id)
    log.info("Update roles [%s]: %s", collection.foreign_id, collection.label)
    index.update_collection_roles(collection)


@celery.task()
def process_collection(collection_id):
    """Re-analyze the elements of this collection, documents and entities."""
    from aleph.ingest import ingest
    q = db.session.query(Collection).filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)

    # re-process the documents
    q = db.session.query(Document)
    q = q.filter(Document.collection_id == collection_id)
    q = q.filter(Document.parent_id == None)  # noqa
    for document in q:
        ingest.apply_async([document.id], priority=1)

    # re-process entities
    q = db.session.query(Entity)
    q = q.filter(Entity.collection_id == collection.id)
    for entity in q:
        update_entity_full(entity.id)

    update_collection(collection)


def delete_collection(collection):
    collection.delete()
    db.session.commit()
    index.delete_collection(collection.id)
    delete_collection_content.apply_async([collection.id], priority=7)


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
    index.delete_collection(collection_id)

    delete_documents(collection_id, deleted_at=deleted_at)
    delete_entities(collection_id, deleted_at=deleted_at)

    log.info("Deleting permissions...")
    Permission.delete_by_collection(collection_id, deleted_at=deleted_at)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()


@celery.task()
def delete_entities(collection_id, deleted_at=None):
    deleted_at = deleted_at or datetime.utcnow()
    log.info("Deleting entities...")
    Entity.delete_by_collection(collection_id, deleted_at=deleted_at)
    index.delete_entities(collection_id)
    log.info("Deleting cross-referencing matches...")
    Match.delete_by_collection(collection_id, deleted_at=deleted_at)


@celery.task()
def delete_documents(collection_id, deleted_at=None):
    deleted_at = deleted_at or datetime.utcnow()
    log.info("Deleting documents...")
    Document.delete_by_collection(collection_id, deleted_at=deleted_at)
    index.delete_documents(collection_id)
    log.info("Deleting cross-referencing matches...")
    Match.delete_by_collection(collection_id, deleted_at=deleted_at)
