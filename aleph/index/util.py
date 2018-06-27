import time
import logging
from banal import ensure_list
from elasticsearch.helpers import bulk
from elasticsearch import TransportError
from normality import stringify

from aleph.core import es
from aleph.index.core import all_indexes

log = logging.getLogger(__name__)

# This means that text beyond the first 100 MB will not be indexed
INDEX_MAX_LEN = 1024 * 1024 * 500
REQUEST_TIMEOUT = 60 * 60 * 6
TIMEOUT = '%ss' % REQUEST_TIMEOUT
RETRY_DELAY = 10


def refresh_index(index=None):
    """Run a refresh to apply all indexing changes."""
    if index is None:
        index = all_indexes()
    try:
        es.indices.refresh(index=all_indexes(),
                           ignore=[404, 400],
                           ignore_unavailable=True)
    except TransportError as terr:
        log.warning("Index refresh failed: %s", terr)
        time.sleep(RETRY_DELAY)


def unpack_result(res):
    """Turn a document hit from ES into a more traditional JSON object."""
    error = res.get('error')
    if error is not None:
        raise RuntimeError("Query error: %(reason)s" % error)
    if res.get('found') is False:
        return
    data = res.get('_source', {})
    data['id'] = str(res.get('_id'))
    if '_score' in res:
        data['score'] = res.get('_score')
    if 'highlight' in res:
        data['highlight'] = []
        for key, value in res.get('highlight', {}).items():
            data['highlight'].extend(value)
    return data


def authz_query(authz):
    """Generate a search query from an authz object."""
    # Hot-wire authorization entirely for admins.
    if authz.is_admin:
        return {'match_all': {}}
    return field_filter_query('roles', authz.roles)


def field_filter_query(field, values):
    """Need to define work-around for full-text fields."""
    values = ensure_list(values)
    if not len(values):
        return {'match_all': {}}
    if field in ['_id', 'id']:
        return {'ids': {'values': values}}
    if len(values) == 1:
        if field in ['names', 'addresses']:
            field = '%s.text' % field
            return {
                # 'match': {
                #     field: {
                #         'query': values[0],
                #         'operator': 'and',
                #         'zero_terms_query': 'all',
                #         'cutoff_frequency': 0.0001
                #     }
                # }
                'match_phrase': {
                    field: values[0]
                }
            }
        return {'term': {field: values[0]}}
    return {'terms': {field: values}}


def cleanup_query(body):
    """Make a query simpler and more readable. This largely exists for 
    debugging help, since ES should be able to perform the same
    optimisations internally."""
    query = body.get('query', {})
    bool_query = query.get('bool', {})
    for section in ['filter', 'must', 'must_not', 'should']:
            parts = []
            for part in bool_query.pop(section, []):
                if 'match_all' not in part:
                    parts.append(part)
            if len(parts):
                bool_query[section] = parts
    body['query'] = {'bool': bool_query}
    # if not len(body.get('post_filter', {}).get('bool', {}).get('filter', [])):
    #     body.pop('post_filter')
    if not len(body.get('highlight', {})):
        body.pop('highlight')
    if not len(body.get('aggregations', {})):
        body.pop('aggregations')
    return body


def bulk_op(iter, chunk_size=500):
    """Standard parameters for bulk operations."""
    bulk(es, iter,
         stats_only=True,
         chunk_size=chunk_size,
         request_timeout=REQUEST_TIMEOUT,
         timeout=TIMEOUT)


def query_delete(index, query):
    "Delete all documents matching the given query inside the index."
    try:
        es.delete_by_query(index=index,
                           body={'query': query},
                           conflicts='proceed',
                           timeout=TIMEOUT,
                           request_timeout=REQUEST_TIMEOUT)
    except TransportError as terr:
        log.warning("Query delete failed: %s", terr)
        time.sleep(RETRY_DELAY)


def query_update(index, body):
    """Update all documents matching the given query."""
    try:
        es.update_by_query(index=index,
                           body=body,
                           conflicts='proceed',
                           timeout=TIMEOUT,
                           request_timeout=REQUEST_TIMEOUT)
    except TransportError as terr:
        log.warning("Query update failed: %s", terr)
        time.sleep(RETRY_DELAY)


def index_doc(index, id, body):
    """Index a single document and retry until it has been stored."""
    while True:
        try:
            es.index(index=index,
                     doc_type='doc',
                     id=str(id),
                     body=body)
            body['id'] = str(id)
            return body
        except TransportError as terr:
            log.warning("Index error [%s:%s]: %s", index, id, terr)
            time.sleep(RETRY_DELAY)


def index_form(texts):
    """Turn a set of strings into the appropriate form for indexing."""
    results = []
    total_len = 0

    for text in texts:
        # We don't want to store more than INDEX_MAX_LEN of text per doc
        if total_len > INDEX_MAX_LEN:
            # TODO: there might be nicer techniques for dealing with overly
            # long text buffers?
            results = list(set(results))
            total_len = sum((len(t) for t in results))
            if total_len > INDEX_MAX_LEN:
                break

        if isinstance(text, str):
            total_len += len(text)
            results.append(text)
    return results
