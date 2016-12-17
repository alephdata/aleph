import json
import logging
from pprint import pprint  # noqa

from aleph import signals
from aleph.core import es, es_index
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.util import clean_highlight, execute_basic, add_filter
from aleph.search.util import scan_iter
from aleph.search.fragments import aggregate, filter_query, text_query
from aleph.search.facet import parse_facet_result
from aleph.search.records import records_query_internal, records_query_shoulds

log = logging.getLogger(__name__)

DEFAULT_FIELDS = ['collection_id', 'title', 'file_name', 'extension',
                  'languages', 'countries', 'source_url', 'created_at',
                  'updated_at', 'type', 'summary']


def document_authz_filter(q, authz):
    return add_filter(q, {'terms': {'collection_id': authz.collections_read}})


def documents_iter(state, fields=None):
    """Iterate over a set of documents based on a query state."""
    q = text_query(state.text)
    q = document_authz_filter(q, state.authz)
    return scan_iter({
        'query': filter_query(q, state.filters),
        '_source': fields or DEFAULT_FIELDS
    }, TYPE_DOCUMENT)


def documents_query(state, fields=None, facets=True, since=None):
    """Parse a user query string, compose and execute a query."""
    # This used to be several functions, but it's actually incredibly
    # procedural and so it's been linearised into one function. To really
    # clean this up, I think it should be based around an object model of
    # some sort.
    q = text_query(state.text)
    q = document_authz_filter(q, state.authz)

    # Used by alerting to find only updated results:
    if since is not None:
        q = add_filter(q, {
            "range": {
                "created_at": {
                    "gt": since
                }
            }
        })

    # Sorting
    if state.sort == 'newest':
        sort = [{'dates': 'desc'}, {'created_at': 'desc'}, '_score']
    if state.sort == 'oldest':
        sort = [{'dates': 'asc'}, {'created_at': 'asc'}, '_score']
    else:
        sort = ['_score']

    # TODO: find a better way to handle "slightly special" aggregations like
    # entities and collections.
    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    if facets:
        facets = list(state.facet_names)
        if 'collections' in facets:
            aggs = facet_collections(state, q, aggs)
            facets.remove('collections')
        if 'entities' in facets:
            aggs = facet_entities(state, aggs)
            facets.remove('entities')
        aggs = aggregate(state, q, aggs, facets)

    # allow plug-ins to post-process the query.
    signals.document_query_process.send(q=q, state=state)

    q = {
        'sort': sort,
        'size': state.limit,
        'from': state.offset,
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }
    result, hits, output = execute_basic(TYPE_DOCUMENT, q)

    # This will add labels and other contextual information.
    output['facets'] = parse_facet_result(state, result)

    # After the main query has run, a sub-query will be run for each returned
    # result in order to find relevant records for result highlighting.
    sub_shoulds = records_query_shoulds(state)
    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        document['score'] = doc.get('_score')
        document['records'] = {'results': [], 'total': 0}
        collection_id = document.get('collection_id')
        try:
            # FIXME: there's got to be a nicer way of doing this....
            document['public'] = state.authz.collection_public(collection_id)
        except:
            document['public'] = None

        sq = records_query_internal(document['id'], sub_shoulds)
        if sq is not None:
            sub_queries.append(json.dumps({}))
            sub_queries.append(json.dumps(sq))

        output['results'].append(document)

    if not len(sub_queries):
        return output

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

    return output


def facet_entities(state, aggs):
    """Filter entities, facet for collections."""
    # This limits the entity facet collections to the same collections
    # which apply to the document part of the query. It is used by the
    # collections view to show only entity facets from the currently
    # selected collection.
    collections = state.authz.collections_read
    if 'collection' == state.get('scope'):
        collections = state.collection_id

    aggs['entities'] = {
        'nested': {
            'path': 'entities'
        },
        'aggs': {
            'inner': {
                'filter': {
                    'terms': {'entities.collection_id': collections}
                },
                'aggs': {
                    'entities': {
                        'terms': {
                            'field': 'entities.id',
                            'size': state.facet_size
                        }
                    }
                }
            }
        }
    }
    return aggs


def facet_collections(state, q, aggs):
    filters = state.filters
    filters['collection_id'] = state.authz.collections_read
    aggs['scoped']['aggs']['collections'] = {
        'filter': {
            'query': filter_query(q, filters)
        },
        'aggs': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': state.facet_size}
            }
        }
    }
    return aggs
