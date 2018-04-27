import logging

from aleph.core import celery
from aleph.model import Document
from aleph.index import documents as index
from aleph.analyze import analyze_document

log = logging.getLogger(__name__)


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    process_document_id.delay(document.id)
    index.index_document(document)


def delete_document(document, deleted_at=None):
    for child in document.children:
        # TODO: are we likely to hit recursion limits?
        delete_document(child, deleted_at=deleted_at)

    index.delete_document(document.id)
    document.delete(deleted_at=deleted_at)


@celery.task()
def process_document_id(document_id):
    """Perform post-ingest tasks like analysis and indexing."""
    analyze_document(Document.by_id(document_id))


def process_document(document):
    """Perform post-ingest tasks like analysis and indexing."""
    analyze_document(document)
    index.index_document(document)
    index.index_records(document)
