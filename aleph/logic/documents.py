import logging

from aleph.index import index_document

log = logging.getLogger(__name__)


def update_document(document):
    index_document(document, index_records=False)
