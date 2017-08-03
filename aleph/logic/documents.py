import logging
from urlparse import urljoin

from aleph.core import app_url, USER_QUEUE, USER_ROUTING_KEY
from aleph.index import documents as index
from aleph.analyze import analyze_document_id

log = logging.getLogger(__name__)


def document_url(document_id=None):
    path = "documents"
    if document_id is None:
        return urljoin(app_url, path)
    else:
        return urljoin(app_url, "%s/%s" % (path, document_id))


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    analyze_document_id.apply_async([document.id], queue=USER_QUEUE,
                                    routing_key=USER_ROUTING_KEY)
    index.index_document(document)


def delete_document(document, deleted_at=None):
    index.delete_document(document.id)
    document.delete(deleted_at=deleted_at)
