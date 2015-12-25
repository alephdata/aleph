import logging

from aleph.core import celery, es, es_index
from aleph.model import Document
from aleph.index.mapping import DOC_MAPPING, DOC_TYPE

log = logging.getLogger(__name__)


def init_search():
    log.info("Creating ElasticSearch index and uploading mapping...")
    es.indices.create(es_index, ignore=[400, 404])
    es.indices.put_mapping(es_index, DOC_TYPE, {DOC_TYPE: DOC_MAPPING},
                           ignore=[400, 404])


def delete_index():
    es.indices.delete(es_index, ignore=[400, 404])


@celery.task()
def index_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    data = document.to_dict()
    es.index(index=es_index, doc_type=DOC_TYPE, body=data,
             id=document.id)
    # Index pages
    # Index records
