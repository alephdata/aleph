import logging

from aleph.core import celery, get_es, get_es_index
from aleph.model import Document
from aleph.text import latinize_text
from aleph.index.admin import init_search, upgrade_search  # noqa
from aleph.index.admin import delete_index, optimize_search  # noqa
from aleph.index.records import generate_records, clear_records
from aleph.index.entities import index_entity, delete_entity, generate_entities  # noqa
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD, TYPE_ENTITY  # noqa
from aleph.index.mapping import DOCUMENT_MAPPING, RECORD_MAPPING, ENTITY_MAPPING  # noqa
from aleph.index.util import bulk_op

log = logging.getLogger(__name__)


@celery.task()
def index_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    log.info("Index document: %r", document)
    data = document.to_index_dict()
    data['entities'] = generate_entities(document)
    data['title_latin'] = latinize_text(data.get('title'))
    data['summary_latin'] = latinize_text(data.get('summary'))
    get_es().index(index=get_es_index(), doc_type=TYPE_DOCUMENT, body=data,
                   id=document.id)

    clear_records(document.id)
    bulk_op(generate_records(document))


def delete_document(document_id):
    clear_records(document_id)
    get_es().delete(index=get_es_index(), doc_type=TYPE_DOCUMENT,
                    id=document_id)
