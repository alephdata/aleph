import logging

from aleph import graph
from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.index import index_document
from aleph.analyze import analyze_document_id
from aleph.index import delete_document as index_delete

log = logging.getLogger(__name__)


def update_document(document):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    analyze_document_id.apply_async([document.id], queue=USER_QUEUE,
                                    routing_key=USER_ROUTING_KEY)
    index_document(document, index_records=False)
    with graph.transaction() as tx:
        graph.load_document(tx, document)


def delete_document(document, deleted_at=None):
    with graph.transaction() as tx:
        graph.remove_document(tx, document.id)
    index_delete(document.id)
    document.delete(deleted_at=deleted_at)
