import json
import time
import logging
from pprint import pprint  # noqa

from aleph import authz, signals
from aleph.core import get_es, get_es_index
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.util import authz_filter, clean_highlight
from aleph.search.util import execute_basic, parse_filters, FACET_SIZE
from aleph.search.fragments import aggregate, filter_query, text_query
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


def documents_query(state, fields=None, facets=True):
    """Parse a user query string, compose and execute a query."""
    q = text_query(state.text)
    q = authz_filter(q)

    # Sorting -- should this be passed into search directly, instead of
    # these aliases?
    if state.sort == 'newest':
        sort = [{'dates': 'desc'}, {'created_at': 'desc'}, '_score']
    if state.sort == 'oldest':
        sort = [{'dates': 'asc'}, {'created_at': 'asc'}, '_score']
    else:
        sort = ['_score']

    filters = parse_filters(state)
    for entity in state.entity_ids:
        filters.append(('entities.id', entity))

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = state.getlist('facet')
        if 'collections' in facets:
            aggs = facet_collections(q, aggs, filters)
            facets.remove('collections')
        if 'entities' in facets:
            aggs = facet_entities(aggs, state)
            facets.remove('entities')
        aggs = aggregate(q, aggs, facets)

    signals.document_query_process.send(q=q, state=state)
    return {
        'sort': sort,
        'query': filter_query(q, filters, OR_FIELDS),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def facet_entities(aggs, state):
    """Filter entities, facet for collections."""
    entities = state.getlist('entity')
    collections = state.authz_collections
    # This limits the entity facet collections to the same collections
    # which apply to the document part of the query. It is used by the
    # collections view to show only entity facets from the currently
    # selected collection.
    if 'collection' == state.get('scope'):
        filters = state.getlist('filter:collection_id')
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


def run_sub_queries(output, sub_queries):
    if len(sub_queries):
        res = get_es().msearch(index=get_es_index(), doc_type=TYPE_RECORD,
                               body='\n'.join(sub_queries))
        for doc in output['results']:
            for sq in res.get('responses', []):
                sqhits = sq.get('hits', {})
                doc['records']['total'] = sqhits.get('total', 0)
                for hit in sqhits.get('hits', {}):
                    record = hit.get('_source')
                    if doc['id'] != record['document_id']:
                        continue
                    hlt = hit.get('highlight', {})
                    texts = hlt.get('text', []) or hlt.get('text_latin', [])
                    texts = [clean_highlight(t) for t in texts]
                    texts = [t for t in texts if len(t)]
                    if len(texts):
                        record['text'] = texts[0]
                        doc['records']['results'].append(record)


def execute_documents_query(state, query):
    """Execute the query and return a set of results."""
    begin_time = time.time()
    result, hits, output = execute_basic(TYPE_DOCUMENT, query)
    query_duration = (time.time() - begin_time) * 1000
    log.debug('Query ES time: %.5fms', query_duration)

    convert_document_aggregations(result, output, state)
    query_duration = (time.time() - begin_time) * 1000
    log.debug('Post-facet accumulated: %.5fms', query_duration)

    sub_shoulds = records_query_shoulds(state)
    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        document['score'] = doc.get('_score')
        document['records'] = {'results': [], 'total': 0}
        collection_id = document.get('collection_id')
        document['public'] = authz.collections_public(collection_id)

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
