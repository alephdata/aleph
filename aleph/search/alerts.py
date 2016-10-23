import logging
from pprint import pprint  # noqa

from aleph import authz
from aleph.search.util import add_filter, authz_filter
from aleph.search.query import QueryState
from aleph.search.documents import execute_documents_query
from aleph.search.fragments import filter_query, text_query


log = logging.getLogger(__name__)


def alert_query(alert):
    """Execute the query and return a set of results."""
    # TODO pass this in some other way:
    colletions = authz.collections(authz.READ)
    args = {
        'q': alert.query_text,
        'entity': alert.entity_id
    }
    state = QueryState(args, authz_collections=colletions)
    q = text_query(state)
    q = authz_filter(q)
    if alert.entity_id:
        q = filter_query(q, [('entities.id', alert.entity_id)])
    if alert.notified_at:
        q = add_filter(q, {
            "range": {
                "created_at": {
                    "gt": alert.notified_at
                }
            }
        })
    q = {
        'query': q,
        'size': 50,
        '_source': ['title', 'id', 'type',
                    'source_collection_id', 'collection_id']
    }
    return execute_documents_query(state, q)
