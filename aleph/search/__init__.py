import logging
from itertools import count
from elasticsearch.helpers import scan

from aleph.core import get_es, get_es_index
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD  # noqa
from aleph.search.documents import documents_query, execute_documents_query  # noqa
from aleph.search.records import records_query, execute_records_query  # noqa

PAGE = 1000

log = logging.getLogger(__name__)


def scan_iter(query):
    for res in scan(get_es(), query=query, index=get_es_index(),
                    doc_type=[TYPE_DOCUMENT]):
        yield res


def raw_iter(query):
    for page in count(0):
        query['from'] = PAGE * page
        query['size'] = PAGE
        result = get_es().search(index=get_es_index(),
                                 doc_type=TYPE_DOCUMENT,
                                 body=query)
        hits = result.get('hits', {})
        for doc in hits.get('hits', []):
            yield doc

        if not hits.get('total') > PAGE * (page + 1):
            return
