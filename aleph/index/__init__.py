import logging

from pyelasticsearch.exceptions import ElasticHttpNotFoundError
from pyelasticsearch.exceptions import IndexAlreadyExistsError

from aleph.core import celery, es, es_index
from aleph.index.mapping import DOC_MAPPING, DOC_TYPE

log = logging.getLogger(__name__)


def init_search():
    log.info("Creating ElasticSearch index and uploading mapping...")
    try:
        es.create_index(es_index)
    except IndexAlreadyExistsError:
        pass
    es.put_mapping(es_index, DOC_TYPE, {DOC_TYPE: DOC_MAPPING})


def delete_index():
    try:
        es.delete_index(es_index)
    except ElasticHttpNotFoundError:
        pass


@celery.task()
def index_document(document_id):
    pass
