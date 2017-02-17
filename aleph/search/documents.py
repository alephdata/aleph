import json
import time
import logging
from pprint import pprint  # noqa

from aleph import authz, signals
from aleph.core import es, es_index
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.util import clean_highlight, execute_basic, FACET_SIZE
from aleph.search.fragments import aggregate, filter_query, text_query
from aleph.search.facet import parse_facet_result
from aleph.search.records import records_query_internal, records_query_shoulds

log = logging.getLogger(__name__)

DEFAULT_FIELDS = ['collection_id', 'title', 'file_name', 'extension',
                  'languages', 'countries', 'source_url', 'created_at',
                  'updated_at', 'type', 'summary', 'source_collection_id']


def documents_query(state, fields=None, facets=True):
    """Parse a user query string, compose and execute a query."""
    q = text_query(state.text)

    # Sorting
    if state.sort == 'newest':
        sort = [{'dates': 'desc'}, {'created_at': 'desc'}, '_score']
    elif state.sort == 'oldest':
        sort = [{'dates': 'asc'}, {'created_at': 'asc'}, '_score']
    else:
        sort = ['_score']

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = list(state.facet_names)
        if 'collections' in facets:
            aggs = facet_collections(q, aggs, state)
            facets.remove('collections')
        if 'entities' in facets:
            aggs = facet_entities(aggs, state)
            facets.remove('entities')
        # XXX make generic
        if 'publication_date' in facets:
            aggs['publication_date'] = {
                'date_histogram': {'field': 'publication_date', 'interval': 'month'},
            }
            facets.remove('publication_date')
        aggs = aggregate(q, aggs, facets)

    signals.document_query_process.send(q=q, state=state)
    return {
        'sort': sort,
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def facet_entities(aggs, state):
    """Filter entities, facet for collections."""
    # This limits the entity facet collections to the same collections
    # which apply to the document part of the query. It is used by the
    # collections view to show only entity facets from the currently
    # selected collection.
    collections = state.authz_collections
    if 'collection' == state.get('scope'):
        collections = state.collection_id

    aggs['entities'] = {
        'nested': {
            'path': 'entities'
        },
        'aggs': {
            'inner': {
                'filter': {'terms': {'entities.collection_id': collections}},
                'aggs': {
                    'entities': {
                        'terms': {'field': 'entities.id', 'size': FACET_SIZE}
                    }
                }
            }
        }
    }
    return aggs


def facet_collections(q, aggs, state):
    filters = state.filters
    filters['collection_id'] = state.authz_collections
    aggs['scoped']['aggs']['collections'] = {
        'filter': {
            'query': filter_query(q, filters)
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
        body = '\n'.join(sub_queries)
        res = es.msearch(index=es_index, doc_type=TYPE_RECORD, body=body)
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

    output['facets'] = parse_facet_result(state, result)
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
        try:
            document['public'] = authz.collections_public(collection_id)
        except:
            document['public'] = None

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
