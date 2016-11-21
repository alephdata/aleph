import logging
from elasticsearch.helpers import scan

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD  # noqa
from aleph.search.query import QueryState  # noqa
from aleph.search.documents import documents_query, execute_documents_query  # noqa
from aleph.search.entities import entities_query, execute_entities_query  # noqa
from aleph.search.entities import suggest_entities, similar_entities  # noqa
from aleph.search.records import records_query, execute_records_query  # noqa

log = logging.getLogger(__name__)


def scan_iter(query):
    """Scan the results of a query. No pagination is applied."""
    return scan(es, query=query, index=es_index, doc_type=[TYPE_DOCUMENT])
