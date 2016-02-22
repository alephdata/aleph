import json
from pprint import pprint  # noqa
from collections import defaultdict

from werkzeug.datastructures import MultiDict

from aleph.core import es, es_index, url_for
from aleph import authz
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.util import add_filter, authz_filter
from aleph.search.facets import convert_aggregations
from aleph.search.records import records_query

DEFAULT_FIELDS = ['source_id', 'title', 'file_name', 'extension', 'mime_type',
                  'source_url', 'created_at', 'updated_at', 'type']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['source_id']


def documents_query(args, fields=None, facets=True, min_id=None):
    """Parse a user query string, compose and execute a query."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    text = args.get('q', '').strip()
    q = text_query(text)
    q = authz_filter(q)
    if min_id is not None:
        q = add_filter(q, {
            "range": {
                "id": {
                    "gt": min_id
                }
            }
        })

    if text:
        sort = ['_score']
    else:
        sort = [{'updated_at': 'desc'}, {'created_at': 'desc'}, '_score']

    # Extract filters, given in the form: &filter:foo_field=bla_value
    filters = []
    for key in args.keys():
        for value in args.getlist(key):
            if not key.startswith('filter:'):
                continue
            _, field = key.split(':', 1)
            filters.append((field, value))

    for entity in args.getlist('entity'):
        filters.append(('entities.entity_id', entity))

    aggs = {}
    if facets:
        aggs = aggregate(q, args, filters)
        aggs = facet_source(q, aggs, filters)
        q = entity_watchlists(q, aggs, args, filters)

    return {
        'sort': sort,
        'query': filter_query(q, filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def entity_watchlists(q, aggs, args, filters):
    """ Filter entities, facet for watchlists. """
    entities = args.getlist('entity')
    watchlists = []
    readable = authz.watchlists(authz.READ)
    for watchlist_id in args.getlist('watchlist'):
        if authz.watchlist_read(watchlist_id):
            watchlists.append(watchlist_id)

    flt = {
        'or': [
            {
                'terms': {'entities.watchlist_id': watchlists}
            },
            {
                'and': [
                    {
                        'terms': {'entities.watchlist_id': readable},
                        'terms': {'entities.entity_id': entities},
                    }
                ]
            }
        ]
    }
    aggs['entities'] = {
        'nested': {
            'path': 'entities'
        },
        'aggs': {
            'inner': {
                'filter': flt,
                'aggs': {
                    'entities': {
                        'terms': {'field': 'entity_id',
                                  'size': 100}
                    }
                }
            }
        }
    }
    return q


def facet_source(q, aggs, filters):
    aggs['scoped']['aggs']['source'] = {
        'filter': {
            'query': filter_query(q, filters, skip='source_id')
        },
        'aggs': {
            'source': {
                'terms': {'field': 'source_id', 'size': 1000}
            }
        }
    }
    return aggs


def aggregate(q, args, filters):
    # Generate aggregations. They are a generalized mechanism to do facetting
    # in ElasticSearch. Anything placed inside the "scoped" sub-aggregation
    # is made to be ``global``, ie. it'll have to bring it's own filters.
    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    for facet in args.getlist('facet'):
        agg = {facet: {'terms': {'field': facet, 'size': 100}}}
        aggs.update(agg)
    return aggs


def filter_query(q, filters, skip=None):
    """Apply a list of filters to the given query."""
    or_filters = defaultdict(list)
    for field, value in filters:
        if field == skip:
            continue
        if field in OR_FIELDS:
            or_filters[field].append(value)
        else:
            q = add_filter(q, {'term': {field: value}})
    for field, value in or_filters.items():
        q = add_filter(q, {'terms': {field: value}})
    return q


def text_query(text):
    """ Construct the part of a query which is responsible for finding a
    piece of thext in the selected documents. """
    text = text.strip()
    if len(text):
        q = {
            "bool": {
                "minimum_should_match": 1,
                "should": [
                    {
                        "query_string": {
                            "query": text,
                            "fields": ['title^15', 'file_name^10',
                                       'summary^10', 'title_latin',
                                       'summary_latin'],
                            "default_operator": "AND",
                            "use_dis_max": True
                        }
                    },
                    {
                        "has_child": {
                            "type": TYPE_RECORD,
                            "score_mode": "avg",
                            "query": {
                                "bool": {
                                    "should": [
                                        {
                                            "query_string": {
                                                "fields": ["text^5",
                                                           "text_latin"],
                                                "query": text,
                                                "default_operator": "AND",
                                                "use_dis_max": True
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        }
    else:
        q = {'match_all': {}}
    return q


def run_sub_queries(output, sub_queries):
    if len(sub_queries):
        res = es.msearch(index=es_index, doc_type=TYPE_RECORD,
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
                    doc['records']['results'].append(record)
                    doc['records']['total'] = sqhits.get('total', 0)


def execute_documents_query(args, q):
    """Execute the query and return a set of results."""
    result = es.search(index=es_index, doc_type=TYPE_DOCUMENT, body=q)
    hits = result.get('hits', {})
    output = {
        'status': 'ok',
        'results': [],
        'offset': q['from'],
        'limit': q['size'],
        'total': hits.get('total'),
        'next': None,
        'facets': {},
        'watchlists': {}
    }
    convert_aggregations(result, output, args)
    next_offset = output['offset'] + output['limit']
    if output['total'] > next_offset:
        params = {'offset': next_offset}
        for k, v in args.iterlists():
            if k in ['offset']:
                continue
            params[k] = v
        output['next'] = url_for('search.query', **params)

    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        document['score'] = doc.get('_score')
        document['records'] = {'results': [], 'total': 0}

        sq = records_query(document['id'], args, snippet_size=140)
        if sq is not None:
            sub_queries.append(json.dumps({}))
            sub_queries.append(json.dumps(sq))

        document['api_url'] = url_for('document.view',
                                      document_id=doc.get('_id'))
        document['data_url'] = url_for('document.file',
                                       document_id=doc.get('_id'))
        output['results'].append(document)

    run_sub_queries(output, sub_queries)
    return output


def execute_documents_alert_query(args, q):
    """Execute the query and return a set of results."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    q['size'] = 50
    result = es.search(index=es_index, doc_type=TYPE_DOCUMENT, body=q)
    hits = result.get('hits', {})
    output = {
        'total': hits.get('total'),
        'results': [],
    }
    convert_aggregations(result, output, args)
    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        for source in output['sources']['values']:
            if source['id'] == document['source_id']:
                document['source'] = source
        document['records'] = {'results': [], 'total': 0}

        sq = records_query(document['id'], args, size=1, snippet_size=140)
        if sq is not None:
            sub_queries.append(json.dumps({}))
            sub_queries.append(json.dumps(sq))
        output['results'].append(document)

    run_sub_queries(output, sub_queries)
    return output
