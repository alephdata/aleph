import json
import time
import logging
from pprint import pprint  # noqa

from werkzeug.datastructures import MultiDict

from aleph import authz, signals
from aleph.core import get_es, get_es_index
from aleph.model import Collection
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.util import add_filter, authz_filter, clean_highlight
from aleph.search.util import execute_basic, parse_filters, FACET_SIZE
from aleph.search.fragments import text_query_string, meta_query_string
from aleph.search.fragments import match_all, child_record, aggregate
from aleph.search.fragments import filter_query
from aleph.search.facets import convert_document_aggregations
from aleph.search.records import records_query_internal, records_query_shoulds

log = logging.getLogger(__name__)

DEFAULT_FIELDS = ['collection_id', 'title', 'file_name', 'extension',
                  'languages', 'countries', 'source_url', 'created_at',
                  'updated_at', 'type', 'summary', 'source_collection_id']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['collection_id']


def documents_query(args, fields=None, facets=True):
    """Parse a user query string, compose and execute a query."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    text = args.get('q', '').strip()
    q = text_query(text)
    q = authz_filter(q)

    # Sorting -- should this be passed into search directly, instead of
    # these aliases?
    sort_mode = args.get('sort', '').strip().lower()
    if text or sort_mode == 'score':
        sort = ['_score']
    elif sort_mode == 'newest':
        sort = [{'dates': 'desc'}, {'created_at': 'desc'}, '_score']
    elif sort_mode == 'oldest':
        sort = [{'dates': 'asc'}, {'created_at': 'asc'}, '_score']
    else:
        sort = [{'updated_at': 'desc'}, {'created_at': 'desc'}, '_score']

    filters = parse_filters(args)
    for entity in args.getlist('entity'):
        filters.append(('entities.id', entity))

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = args.getlist('facet')
        if 'collections' in facets:
            aggs = facet_collections(q, aggs, filters)
            facets.remove('collections')
        if 'entities' in facets:
            aggs = facet_entities(aggs, args)
            facets.remove('entities')
        aggs = aggregate(q, aggs, facets)

    signals.document_query_process.send(q=q, args=args)
    return {
        'sort': sort,
        'query': filter_query(q, filters, OR_FIELDS),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def facet_entities(aggs, args):
    """Filter entities, facet for collections."""
    entities = args.getlist('entity')
    collections = authz.collections(authz.READ)
    # This limits the entity facet collections to the same collections
    # which apply to the document part of the query. It is used by the
    # collections view to show only entity facets from the currently
    # selected collection.
    if 'collection' == args.get('scope'):
        filters = args.getlist('filter:collection_id')
        collections = [c for c in collections if str(c) in filters]
    flt = {
        'bool': {'must': [{'terms': {'entities.collection_id': collections}}]}
    }
    if len(entities):
        flt['bool']['must'].append({'terms': {'entities.id': entities}})
    aggs['entities'] = {
        'nested': {
            'path': 'entities'
        },
        'aggs': {
            'inner': {
                'filter': flt,
                'aggs': {
                    'entities': {
                        'terms': {'field': 'entities.id', 'size': FACET_SIZE}
                    }
                }
            }
        }
    }
    return aggs


def facet_collections(q, aggs, filters):
    aggs['scoped']['aggs']['collections'] = {
        'filter': {
            'query': filter_query(q, filters, OR_FIELDS, skip='collection_id')
        },
        'aggs': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': 1000}
            }
        }
    }
    return aggs


def text_query(text):
    """Part of a query which finds a piece of text."""
    if text is None or not len(text.strip()):
        return match_all()
    return {
        "bool": {
            "minimum_should_match": 1,
            "should": [
                meta_query_string(text),
                child_record({
                    "bool": {
                        "should": [text_query_string(text)]
                    }
                })
            ]
        }
    }


def run_sub_queries(output, sub_queries):
    if len(sub_queries):
        res = get_es().msearch(index=get_es_index(), doc_type=TYPE_RECORD,
                               body='\n'.join(sub_queries))
        for doc in output['results']:
            for sq in res.get('responses', []):
                sqhits = sq.get('hits', {})
                for hit in sqhits.get('hits', {}):
                    record = hit.get('_source')
                    if doc['id'] != record.get('document_id'):
                        continue
                    record['score'] = hit.get('_score')
                    highlights = hit.get('highlight', {})
                    if len(highlights.get('text', [])):
                        record['text'] = highlights.get('text')
                    elif len(highlights.get('text_latin', [])):
                        record['text'] = highlights.get('text_latin', [])
                    else:
                        continue
                    record['text'] = [clean_highlight(t) for t in record['text']]
                    doc['records']['results'].append(record)
                    doc['records']['total'] = sqhits.get('total', 0)


def execute_documents_query(args, query):
    """Execute the query and return a set of results."""
    begin_time = time.time()
    result, hits, output = execute_basic(TYPE_DOCUMENT, query)
    query_duration = (time.time() - begin_time) * 1000
    log.debug('Query ES time: %.5fms', query_duration)
    convert_document_aggregations(result, output, args)
    query_duration = (time.time() - begin_time) * 1000
    log.debug('Post-facet accumulated: %.5fms', query_duration)
    sub_shoulds = records_query_shoulds(args)

    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        document['score'] = doc.get('_score')
        document['records'] = {'results': [], 'total': 0}

        # TODO: restore entity highlighting somehow.
        sq = records_query_internal(document['id'], sub_shoulds)
        if sq is not None:
            sub_queries.append(json.dumps({}))
            sub_queries.append(json.dumps(sq))

        output['results'].append(document)

    run_sub_queries(output, sub_queries)
    query_duration = (time.time() - begin_time) * 1000
    log.debug('Post-subquery accumulated: %.5fms', query_duration)
    return output


def alert_query(alert):
    """Execute the query and return a set of results."""
    q = text_query(alert.query_text)
    q = authz_filter(q)
    if alert.entity_id:
        q = filter_query(q, [('entities.id', alert.entity_id)], OR_FIELDS)
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
        'size': 150
    }

    result, hits, output = execute_basic(TYPE_DOCUMENT, q)
    collections = {}
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        document['collections'] = []
        for coll in document['collection_id']:
            if coll not in authz.collections(authz.READ):
                continue
            if coll not in collections:
                collections[coll] = Collection.by_id(coll)
            if collections[coll] is None:
                continue
            document['collections'].append(collections[coll])
        document['records'] = {'results': [], 'total': 0}
        output['results'].append(document)
    return output
