import logging
from elasticsearch.exceptions import NotFoundError

from aleph.core import celery, es, es_index
from aleph.model import Document, Reference
from aleph.index.records import index_records, clear_records
from aleph.index.mapping import TYPE_DOCUMENT

log = logging.getLogger(__name__)


@celery.task()
def index_document_id(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)
    index_records(document)


def index_document(document):
    if document.status == Document.STATUS_PENDING:
        return

    log.info("Index document: %r", document)
    data = document.to_index_dict()

    data['entities'] = []
    for entity_id, collection_id in Reference.index_references(document.id):
        data['entities'].append({
            'id': entity_id,
            'collection_id': collection_id
        })

    es.index(index=es_index, doc_type=TYPE_DOCUMENT, body=data, id=document.id)


def delete_document(document_id):
    clear_records(document_id)
    try:
        es.delete(index=es_index, doc_type=TYPE_DOCUMENT, id=document_id)
    except NotFoundError:
        pass
