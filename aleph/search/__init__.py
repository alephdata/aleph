import logging
from itertools import count
from pyelasticsearch.exceptions import ElasticHttpNotFoundError
from pyelasticsearch.exceptions import IndexAlreadyExistsError

from aleph.core import es, es_index
from aleph.search.mapping import DOC_MAPPING, DOC_TYPE
from aleph.search.result_proxy import ESResultProxy
from aleph.search.queries import document_query # noqa

PAGE = 500

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


def search_documents(query):
    return ESResultProxy(DOC_TYPE, query)


def raw_iter(query, total=10000):
    for page in count(0):
        query['from'] = PAGE * page
        if query['from'] >= total:
            return
        query['size'] = PAGE
        result = es.search(index=es_index,
                           doc_type=DOC_TYPE,
                           body=query)
        hits = result.get('hits', {})
        for doc in hits.get('hits', []):
            yield doc

        if not hits.get('total') > PAGE * (page + 1):
            return
