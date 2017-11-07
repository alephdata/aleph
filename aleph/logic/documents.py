import logging

from aleph.core import celery
from aleph.model import Document
from aleph.index import documents as index
from aleph.analyze import analyze_document
from aleph.logic.util import ui_url

log = logging.getLogger(__name__)


def document_url(document_id=None, **query):
    return ui_url('documents', id=document_id, **query)


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    process_document_id.delay(document.id)
    index.index_document(document)


def delete_document(document, deleted_at=None):
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
