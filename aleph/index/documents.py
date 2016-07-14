import logging
from elasticsearch.exceptions import NotFoundError

from aleph.core import celery, get_es, get_es_index
from aleph.model import Document
from aleph.text import latinize_text
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
    log.info("Index document: %r", document)
    data = document.to_index_dict()
    data['entities'] = generate_entities(document)
    data['title_latin'] = latinize_text(data.get('title'))
    data['summary_latin'] = latinize_text(data.get('summary'))
    get_es().index(index=get_es_index(), doc_type=TYPE_DOCUMENT, body=data,
                   id=document.id)

    if index_records:
        clear_records(document.id)
        bulk_op(generate_records(document))


def delete_document(document_id):
    clear_records(document_id)
    try:
        get_es().delete(index=get_es_index(), doc_type=TYPE_DOCUMENT,
                        id=document_id)
    except NotFoundError:
        pass
