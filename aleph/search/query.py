from pprint import pprint  # noqa
from collections import defaultdict

from werkzeug.datastructures import MultiDict

from aleph.core import es, es_index, url_for
from aleph import authz
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.common import add_filter, authz_filter
from aleph.search.facets import convert_aggregations

QUERY_FIELDS = ['title^100', 'file_name^10', 'summary^2']
DEFAULT_FIELDS = ['source_id', 'title', 'content_hash', 'file_name',
                  'extension', 'mime_type', 'countries', 'languages',
                  'source_url', 'created_at', 'updated_at', 'type']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['source_id']


def construct_query(args, fields=None, facets=True):
    """ Parse a user query string, compose and execute a query. """
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    q = text_query(args.get('q', ''))
    q = authz_filter(q)

    # Extract filters, given in the form: &filter:foo_field=bla_value
    filters = []
    for key in args.keys():
        for value in args.getlist(key):
            if not key.startswith('filter:'):
                continue
            _, field = key.split(':', 1)
            filters.append((field, value))

    aggs = {}
    if facets:
        aggs = aggregate(q, args, filters)
        aggs = facet_source(q, aggs, filters)
        q = entity_watchlists(q, aggs, args, filters)

    sort = ['_score']
    return {
        'sort': sort,
        'query': filter_query(q, filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def entity_watchlists(q, aggs, args, filters):
    """ Filter entities, facet for watchlists. """
    for watchlist_id in args.getlist('watchlist'):
        if not authz.watchlist_read(watchlist_id):
            continue

        list_facet = {
            'nested': {
                'path': 'entities'
            },
            'aggs': {
                'inner': {
                    'filter': {
                        'term': {'entities.watchlist_id': watchlist_id}
                    },
                    'aggs': {
                        'entities': {
                            'terms': {'field': 'entity_id',
                                      'size': 50}
                        }
                    }
                }
            }
        }
        name = 'watchlist__%s' % watchlist_id
        aggs[name] = list_facet
        # aggs['scoped']['aggs'][name] = {
        #     'filter': {
        #         'query': filter_query(q, filters)
        #     },
        #     'aggs': {
        #         name: list_facet
        #     }
        # }

    for entity in args.getlist('entity'):
        cf = {'term': {'entities.entity_id': entity}}
        q = add_filter(q, cf)

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
        agg = {facet: {'terms': {'field': facet, 'size': 200}}}
        aggs.update(agg)
    return aggs


def filter_query(q, filters, skip=None):
    """ Apply a list of filters to the given query. """
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
                "should": {
                    "multi_match": {
                        "query": text,
                        "fields": QUERY_FIELDS,
                        "type": "most_fields",
                        "cutoff_frequency": 0.0007,
                        "operator": "and",
                    },
                },
                "should": {
                    "multi_match": {
                        "query": text,
                        "fields": QUERY_FIELDS,
                        "type": "phrase"
                    },
                },
                "should": {
                    "has_child": {
                        "type": TYPE_RECORD,
                        "score_mode": "sum",
                        "query": {
                            "match": {
                                "text": {
                                    "query": text,
                                    "cutoff_frequency": 0.0007,
                                    "operator": "and"
                                }
                            },
                        }
                    }
                }
            }
        }
    else:
        q = {'match_all': {}}
    return q


def execute_query(args, q):
    """ Execute the query and return a set of results. """
    result = es.search(index=es_index, doc_type=TYPE_DOCUMENT, body=q)
    hits = result.get('hits', {})
    output = {
        'status': 'ok',
        'results': [],
        'offset': q['from'],
        'limit': q['size'],
        'took': result.get('took'),
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
            if k in ['facet', 'offset']:
                continue
            params[k] = v
        output['next'] = url_for('search.query', **params)

    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = doc.get('_id')
        document['api_url'] = url_for('data.document',
                                      document_id=doc.get('_id'))
        document['data_url'] = url_for('data.file',
                                       document_id=doc.get('_id'))
        output['results'].append(document)
    return output
