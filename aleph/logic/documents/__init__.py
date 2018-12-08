import logging

from aleph.core import settings, celery
from aleph.model import Document
from aleph.index import documents as index
from aleph.logic.entities import refresh_entity
from aleph.logic.notifications import flush_notifications
from aleph.logic.documents.ingest import ingest, ingest_document  # noqa

log = logging.getLogger(__name__)


@celery.task()
def index_document_id(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index.index_document(document, shallow=False, sync=False)


def update_document(document, shallow=False, sync=False):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    refresh_entity(document, sync=sync)
    return index.index_document(document, shallow=shallow, sync=sync)


def _delete_document(document, deleted_at=None, sync=False):
    for child in document.children:
        # TODO: are we likely to hit recursion limits?
        _delete_document(child, deleted_at=deleted_at, sync=sync)
    flush_notifications(document)
    index.delete_document(document.id, sync=sync)
    document.delete(deleted_at=deleted_at)


def delete_document(document, deleted_at=None, sync=False):
    refresh_entity(document, sync=sync)
    _delete_document(document, deleted_at=deleted_at, sync=sync)


@celery.task(priority=1)
def process_documents(collection_id=None, failed_only=False, index_only=False):
    """Re-ingest or re-index all documents. Can be filtered to cover only
    documents which failed to properly import last time, or those which
    are part of a particular collection."""
    q = Document.find_ids(collection_id=collection_id,
                          failed_only=failed_only)
    q = q.all() if settings.EAGER else q.yield_per(5000)
    for idx, (doc_id,) in enumerate(q, 1):
        if index_only:
            index_document_id.apply_async([doc_id], priority=1)
        else:
            ingest.apply_async([doc_id], {'refresh': True}, priority=1)
        if idx % 10000 == 0:
            log.info("Process: %s documents...", idx)
