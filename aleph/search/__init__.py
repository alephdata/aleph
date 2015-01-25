import logging
from pyelasticsearch.exceptions import ElasticHttpNotFoundError

from aleph.core import es, es_index
from aleph.search.mapping import DOC_MAPPING, DOC_TYPE
from aleph.search.result_proxy import ESResultProxy
from aleph.search.queries import document_query # noqa

log = logging.getLogger(__name__)


def init_search():
    try:
        es.delete_index(es_index)
    except ElasticHttpNotFoundError:
        pass
    es.create_index(es_index)
    log.info("Creating ElasticSearch index and uploading mapping...")
    es.put_mapping(es_index, DOC_TYPE, {DOC_TYPE: DOC_MAPPING})


def search_documents(query):
    return ESResultProxy(DOC_TYPE, query)
