import logging
from hashlib import sha1

from apikit.jsonify import JSONEncoder
from elasticsearch.helpers import bulk, scan

from aleph.core import celery, es, es_index
from aleph.model import Document
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD
from aleph.index.mapping import DOCUMENT_MAPPING, RECORD_MAPPING

log = logging.getLogger(__name__)
es.json_encoder = JSONEncoder


def init_search():
    log.info("Creating ElasticSearch index and uploading mapping...")
    es.indices.create(es_index, ignore=[400, 404])
    es.indices.put_mapping(index=es_index,
                           doc_type=TYPE_DOCUMENT,
                           body={TYPE_DOCUMENT: DOCUMENT_MAPPING},
                           ignore=[400, 404])
    es.indices.put_mapping(index=es_index,
                           doc_type=TYPE_RECORD,
                           body={TYPE_RECORD: RECORD_MAPPING},
                           ignore=[400, 404])


def delete_index():
    es.indices.delete(es_index, ignore=[400, 404])


def clear_children(document):
    q = {'query': {'term': {'document_id': document.id}}}

    def gen_deletes():
            for res in scan(es, query=q, index=es_index,
                            doc_type=[TYPE_RECORD]):
                yield {
                    '_op_type': 'delete',
                    '_index': es_index,
                    '_type': res.get('_type'),
                    '_id': res.get('_id')
                }

    bulk(es, gen_deletes(), stats_only=True, chunk_size=2000,
         request_timeout=60.0)


def generate_pages(document):
    for page in document.pages:
        tid = sha1(str(document.id))
        tid.update(str(page.id))
        tid = tid.hexdigest()
        yield {
            '_id': tid,
            '_type': TYPE_RECORD,
            '_index': es_index,
            '_parent': document.id,
            '_source': {
                'id': tid,
                'type': 'page',
                'content_hash': document.content_hash,
                'document_id': document.id,
                'page_number': page.number,
                'text': page.text
            }
        }


def generate_records(document):
    for table in document.tables:
        for row in table:
            row_id = row.pop('_id')
            tid = sha1(str(document.id))
            tid.update(str(table.schema.sheet))
            tid.update(str(row_id))
            tid = tid.hexdigest()
            text = [t for t in row.values() if t is not None]
            text = list(set(text))
            yield {
                '_id': tid,
                '_type': TYPE_RECORD,
                '_index': es_index,
                '_parent': document.id,
                '_source': {
                    'id': tid,
                    'type': 'row',
                    'content_hash': document.content_hash,
                    'document_id': document.id,
                    'row_id': row_id,
                    'sheet': table.schema.sheet,
                    'text': text,
                    'raw': row
                }
            }


def generate_entities(document):
    entities = []
    for reference in document.references:
        entities.append({
            'id': reference.id,
            'weight': reference.weight,
            'entity_id': reference.entity.id,
            'list_id': reference.entity.list_id,
            'name': reference.entity.name,
            'category': reference.entity.category
        })
    return entities


@celery.task()
def index_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    log.info("Index document: %r", document)
    data = document.to_dict()
    data['entities'] = generate_entities(document)
    es.index(index=es_index, doc_type=TYPE_DOCUMENT, body=data,
             id=document.id)
    clear_children(document)

    try:
        if document.type == Document.TYPE_TEXT:
            bulk(es, generate_pages(document), stats_only=True,
                 chunk_size=2000, request_timeout=60.0)

        if document.type == Document.TYPE_TABULAR:
            bulk(es, generate_records(document), stats_only=True,
                 chunk_size=2000, request_timeout=60.0)
    except Exception as ex:
        log.exception(ex)
