import logging
from itertools import count

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD  # noqa
from aleph.search.documents import documents_query, execute_documents_query  # noqa
from aleph.search.records import records_query, execute_records_query  # noqa

PAGE = 1000

log = logging.getLogger(__name__)


def raw_iter(query, total=10000):
    for page in count(0):
        query['from'] = PAGE * page
        if query['from'] >= total:
            return
        query['size'] = PAGE
        result = es.search(index=es_index,
                           doc_type=TYPE_DOCUMENT,
                           body=query)
        hits = result.get('hits', {})
        for doc in hits.get('hits', []):
            yield doc

        if not hits.get('total') > PAGE * (page + 1):
            return
