import logging
from datetime import datetime

from aleph.core import db, celery
from aleph.ingest import ingest
from aleph.model import Collection, Document, Entity, Match, Permission
from aleph.index.admin import flush_index
from aleph.index.collections import delete_collection as index_delete
from aleph.index.collections import delete_documents as index_delete_documents
from aleph.index.collections import delete_entities as index_delete_entities
from aleph.index.collections import index_collection, update_roles
from aleph.logic.entities import update_entity_full
from aleph.logic.xref import xref_collection
from aleph.logic.util import ui_url

log = logging.getLogger(__name__)


def collection_url(collection_id=None, **query):
    return ui_url('collections', id=collection_id, **query)


def update_collection(collection, roles=False):
    """Create or update a collection."""
    if collection.deleted_at is not None:
        index_delete(collection.id)
        return

    collection.updated_at = datetime.utcnow()
    db.session.add(collection)
    db.session.commit()

    log.info("Updating: %r", collection)
    index_collection(collection)
    if roles:
        update_roles(collection)

    if not collection.managed:
        xref_collection.apply_async([collection.id], priority=3)

    flush_index()


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
        ingest.apply_async([document.id], priority=1)

    # re-process entities
    q = db.session.query(Entity)
    q = q.filter(Entity.collection_id == collection.id)
    for entity in q:
        update_entity_full(entity.id)

    update_collection(collection)


@celery.task()
def delete_collection(collection_id, wait=False):
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
    index_delete(collection_id, wait=wait)

    log.info("Deleting cross-referencing matches...")
    Match.delete_by_collection(collection_id)

    log.info("Deleting permissions...")
    Permission.delete_by_collection(collection_id, deleted_at=deleted_at)

    delete_documents(collection_id, wait=wait)
    delete_entities(collection_id, wait=wait)

    collection.delete(deleted_at=deleted_at)
    db.session.commit()


@celery.task()
def delete_entities(collection_id, wait=False):
    deleted_at = datetime.utcnow()
    log.info("Deleting entities...")
    Entity.delete_by_collection(collection_id, deleted_at=deleted_at)
    index_delete_entities(collection_id, wait=wait)


@celery.task()
def delete_documents(collection_id, wait=False):
    deleted_at = datetime.utcnow()
    log.info("Deleting documents...")
    Document.delete_by_collection(collection_id, deleted_at=deleted_at)
    index_delete_documents(collection_id, wait=wait)
