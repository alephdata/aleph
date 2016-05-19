import logging
from elasticsearch.helpers import bulk, scan

from aleph.core import celery, get_es, get_es_index
from aleph.model import Document
from aleph.text import latinize_text
from aleph.index.admin import init_search, upgrade_search  # noqa
from aleph.index.admin import delete_index, optimize_search  # noqa
from aleph.index.records import generate_records, clear_records
from aleph.index.entities import index_entity, delete_entity  # noqa
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD, TYPE_ENTITY  # noqa
from aleph.index.mapping import DOCUMENT_MAPPING, RECORD_MAPPING, ENTITY_MAPPING  # noqa

log = logging.getLogger(__name__)


def delete_source(source_id):
    """Delete all documents from a particular source."""
    q = {'query': {'term': {'source_id': source_id}}, '_source': False}

    def deletes():
        for res in scan(get_es(), query=q, index=get_es_index(),
                        doc_type=[TYPE_RECORD]):
            yield {
                '_op_type': 'delete',
                '_index': get_es_index(),
                '_parent': res.get('_parent'),
                '_type': res.get('_type'),
                '_id': res.get('_id')
            }
        for res in scan(get_es(), query=q, index=get_es_index(),
                        doc_type=[TYPE_DOCUMENT]):
            yield {
                '_op_type': 'delete',
                '_index': get_es_index(),
                '_type': res.get('_type'),
                '_id': res.get('_id')
            }

    try:
        bulk(get_es(), deletes(), stats_only=True, chunk_size=2000,
             request_timeout=60.0)
    except Exception:
        log.debug("Failed to clear documents: %r", source_id)


def generate_entities(document):
    entities = []
    for reference in document.references:
        colls = [c.id for c in reference.entity.collections]
        entities.append({
            'id': reference.id,
            'weight': reference.weight,
            'uuid': reference.entity.id,
            'collection_id': colls,
            'collections': colls,
            'name': reference.entity.name,
            '$schema': reference.entity.type
        })
    return entities


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

    clear_records(document)
    bulk(get_es(), generate_records(document), stats_only=True,
         chunk_size=2000, request_timeout=60.0)
