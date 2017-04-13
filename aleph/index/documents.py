import logging
from elasticsearch.exceptions import NotFoundError

from aleph.core import celery, es, es_index
from aleph.model import Document
from aleph.index.records import generate_records, clear_records
from aleph.index.entities import generate_entities
from aleph.index.mapping import TYPE_DOCUMENT
from aleph.index.util import bulk_op

log = logging.getLogger(__name__)


@celery.task()
def index_document_id(document_id, index_records=True):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)


def index_document(document, index_records=True):
    if document.status == Document.STATUS_PENDING:
        return

    log.info("Index document: %r", document)
    data = document.to_index_dict()
    data['entities'] = generate_entities(document)
    es.index(index=es_index, doc_type=TYPE_DOCUMENT, body=data, id=document.id)

    if index_records:
        clear_records(document.id)
        bulk_op(generate_records(document))


def delete_document(document_id):
    clear_records(document_id)
    try:
        es.delete(index=es_index, doc_type=TYPE_DOCUMENT, id=document_id)
    except NotFoundError:
        pass
