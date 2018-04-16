import time
import logging
from banal import ensure_list
from elasticsearch.helpers import bulk
from elasticsearch import TransportError
from normality import stringify, latinize_text, collapse_spaces

from aleph.core import es

log = logging.getLogger(__name__)

# This means that text beyond the first 100 MB will not be indexed
INDEX_MAX_LEN = 1024 * 1024 * 500
REQUEST_TIMEOUT = 60 * 60 * 2
TIMEOUT = '%ss' % REQUEST_TIMEOUT
RETRY_DELAY = 10


def unpack_result(res):
    """Turn a document hit from ES into a more traditional JSON object."""
    if res.get('found') is False:
        return
    data = res.get('_source', {})
    data['id'] = res.get('_id')
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
    return {'terms': {'roles': list(authz.roles)}}


def field_filter_query(field, values):
    """Need to define work-around for full-text fields."""
    values = ensure_list(values)
    return {'terms': {field: values}}


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


def query_update(index, body):
    """Update all documents matching the given query."""
    try:
        es.update_by_query(index=index,
                           body=body,
                           conflicts='proceed',
                           timeout=TIMEOUT)
    except TransportError as terr:
        log.warning("Query update failed: %s", terr)


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

        text = stringify(text)
        if text is None:
            continue
        text = collapse_spaces(text)
        total_len += len(text)
        results.append(text)

        # Make latinized text version
        latin = latinize_text(text)
        latin = stringify(latin)
        if latin is None or latin == text:
            continue
        total_len += len(latin)
        results.append(latin)
    return results
