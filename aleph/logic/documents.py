import logging

from aleph.index import index_document
from aleph.analyze import analyze_document_id
from aleph.index import delete_document as index_delete

log = logging.getLogger(__name__)


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    analyze_document_id.delay(document.id)
    index_document(document, index_records=False)


def delete_document(document, deleted_at=None):
    document.delete(deleted_at=deleted_at)
    index_delete(document.id)
