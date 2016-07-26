import logging

from aleph.index import index_document

log = logging.getLogger(__name__)


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    index_document(document, index_records=False)
