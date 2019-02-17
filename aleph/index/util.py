import logging
from time import time
from banal import ensure_list
from elasticsearch import TransportError
from elasticsearch.helpers import bulk, BulkIndexError
from servicelayer.util import backoff, service_retries

from aleph.core import es, settings

log = logging.getLogger(__name__)

# This means that text beyond the first 100 MB will not be indexed
INDEX_MAX_LEN = 1024 * 1024 * 500
REQUEST_TIMEOUT = 60 * 60 * 6
TIMEOUT = '%ss' % REQUEST_TIMEOUT
BULK_PAGE = 500
# cf. https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html  # noqa
MAX_PAGE = 9999


def refresh_sync(sync):
    if settings.TESTING:
        return True
    return True if sync else False


def unpack_result(res):
    """Turn a document hit from ES into a more traditional JSON object."""
    error = res.get('error')
    if error is not None:
        raise RuntimeError("Query error: %r" % error)
    if res.get('found') is False:
        return
    data = res.get('_source', {})
    data['id'] = res.get('_id')

    _score = res.get('_score')
    if _score is not None and _score != 0.0:
        data['score'] = _score

    data['_index'] = res.get('_index')

    if 'highlight' in res:
        data['highlight'] = []
        for key, value in res.get('highlight', {}).items():
            data['highlight'].extend(value)
    return data


def authz_query(authz):
    """Generate a search query filter from an authz object."""
    # Hot-wire authorization entirely for admins.
    if authz.is_admin:
        return {'match_all': {}}
    collections = authz.collections(authz.READ)
    if not len(collections):
        return {'match_none': {}}
    return {'terms': {'collection_id': collections}}


def bool_query():
    return {
        'bool': {
            'should': [],
            'filter': [],
            'must': [],
            'must_not': []
        }
    }


def none_query(query=None):
    if query is None:
        query = bool_query()
    query['bool']['must'].append({'match_none': {}})
    return query


def field_filter_query(field, values):
    """Need to define work-around for full-text fields."""
    values = ensure_list(values)
    if not len(values):
        return {'match_all': {}}
    if field in ['_id', 'id']:
        return {'ids': {'values': values}}
    if len(values) == 1:
        if field in ['names']:
            field = 'fingerprints'
        if field in ['addresses']:
            field = '%s.text' % field
            return {'match_phrase': {field: values[0]}}
        return {'term': {field: values[0]}}
    return {'terms': {field: values}}


def query_delete(index, query, sync=False, **kwargs):
    "Delete all documents matching the given query inside the index."
    for attempt in service_retries():
        try:
            es.delete_by_query(index=index,
                               body={'query': query},
                               conflicts='proceed',
                               timeout=TIMEOUT,
                               request_timeout=REQUEST_TIMEOUT,
                               wait_for_completion=sync,
                               refresh=refresh_sync(sync),
                               **kwargs)
            return
        except TransportError as exc:
            log.warning("Query delete failed: %s", exc)
            backoff(failures=attempt)


def bulk_actions(actions, sync=False):
    """Bulk indexing with timeouts, bells and whistles."""
    try:
        start_time = time()
        total, _ = bulk(es, actions,
                        chunk_size=BULK_PAGE,
                        max_retries=10,
                        initial_backoff=2,
                        request_timeout=REQUEST_TIMEOUT,
                        timeout=TIMEOUT,
                        refresh=refresh_sync(sync))
        duration = (time() - start_time)
        log.debug("Bulk write (%s): %.4fs", total, duration)
    except BulkIndexError as exc:
        log.warning('Indexing error: %s', exc)


def index_safe(index, id, body, **kwargs):
    """Index a single document and retry until it has been stored."""
    for attempt in service_retries():
        try:
            es.index(index=index, doc_type='doc', id=id, body=body, **kwargs)
            body['id'] = str(id)
            body.pop('text', None)
            return body
        except TransportError as exc:
            log.warning("Index error [%s:%s]: %s", index, id, exc)
            backoff(failures=attempt)


def configure_index(index, mapping, settings):
    """Create or update a search index with the given mapping and
    settings. This will try to make a new index, or update an
    existing mapping with new properties.
    """
    if es.indices.exists(index=index):
        log.info("Configuring index: %s...", index)
        res = es.indices.put_mapping(index=index, doc_type='doc',
                                     body=mapping, ignore=[400])
        return res.get('status') != 400
    log.info("Creating index: %s...", index)
    es.indices.create(index, body={
        'settings': settings,
        'mappings': {'doc': mapping}
    })
    return True


def index_settings():
    """Configure an index in ES with support for text transliteration."""
    return {
        "index": {
            "number_of_shards": 5,
            "number_of_replicas": 2,
            "analysis": {
                "analyzer": {
                    "icu_latin": {
                        "tokenizer": "standard",
                        "filter": ["latinize"]
                    }
                },
                "normalizer": {
                    "icu_latin": {
                        "type": "custom",
                        "filter": ["latinize"]
                    }
                },
                "filter": {
                    "latinize": {
                        "type": "icu_transform",
                        "id": "Any-Latin; NFKD; Lower(); [:Nonspacing Mark:] Remove; NFKC"  # noqa
                    }
                }
            }
        }
    }
