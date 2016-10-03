import logging
from pprint import pprint  # noqa
from werkzeug.datastructures import MultiDict

from aleph.search.util import add_filter, authz_filter
from aleph.search.documents import OR_FIELDS, execute_documents_query
from aleph.search.fragments import filter_query, text_query


log = logging.getLogger(__name__)


def alert_query(alert):
    """Execute the query and return a set of results."""
    args = {}
    q = text_query(alert.query_text)
    if alert.query_text:
        args['q'] = alert.query_text
    q = authz_filter(q)
    if alert.entity_id:
        q = filter_query(q, [('entities.id', alert.entity_id)], OR_FIELDS)
        args['entity'] = [alert.entity_id]
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
    return execute_documents_query(MultiDict(args), q)
