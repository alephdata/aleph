import logging

from aleph.model import Document
from aleph.index import documents as index
from aleph.index.documents import index_document_id
from aleph.logic.documents.ingest import ingest, ingest_document  # noqa
from aleph.logic.documents.ingest import process_document  # noqa

log = logging.getLogger(__name__)


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    index.index_document(document)


def delete_document(document, deleted_at=None):
    for child in document.children:
        # TODO: are we likely to hit recursion limits?
        delete_document(child, deleted_at=deleted_at)
    index.delete_document(document.id)
    document.delete(deleted_at=deleted_at)


def index_documents(collection_id=None):
    """Re-index all documents (in the given collection, or globally)."""
    q = Document.all_ids()
    # re-index newest document first.
    q = q.order_by(Document.id.desc())
    if collection_id is not None:
        q = q.filter(Document.collection_id == collection_id)
    for idx, (doc_id,) in enumerate(q.yield_per(100000), 1):
        index_document_id.apply_async([doc_id], priority=1)
        if idx % 10000 == 0:
            log.info("Queued: %s documents...", idx)
