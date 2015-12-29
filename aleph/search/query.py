from pprint import pprint  # noqa
from collections import defaultdict

from werkzeug.datastructures import MultiDict

from aleph.core import es, es_index, url_for
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.common import add_filter, authz_filter
from aleph.search.facets import convert_aggregations

QUERY_FIELDS = ['title^100', 'file_name^10', 'summary^2']
DEFAULT_FIELDS = ['source_id', 'title', 'content_hash', 'file_name',
                  'extension', 'mime_type', 'countries', 'languages',
                  'source_url', 'created_at', 'updated_at']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['source_id']


def construct_query(args, fields=None):
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

    facets = args.getlist('facet')
    aggs = aggregate(q, facets, filters)

    sort = ['_score']
    return {
        'sort': sort,
        'query': filter_query(q, filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


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


def aggregate(q, facets, filters):
    # Generate aggregations. They are a generalized mechanism to do facetting
    # in ElasticSearch. Anything placed inside the "scoped" sub-aggregation
    # is made to be ``global``, ie. it'll have to bring it's own filters.
    aggs = {
        'scoped': {
            'global': {},
            'aggs': {}
        }
    }
    for facet in facets:
        agg = {facet: {'terms': {'field': facet, 'size': 200}}}
        if facet in OR_FIELDS:
            aggs['scoped']['aggs'][facet] = {
                'filter': {
                    'query': filter_query(q, filters, skip=facet)
                },
                'aggs': agg
            }
        else:
            aggs.update(agg)
    return aggs


def paginate(q, limit, offset):
    """ Apply pagination to the query, based on limit and offset. """
    try:
        q['from'] = max(0, int(offset))
    except (TypeError, ValueError):
        q['from'] = 0
    try:
        q['size'] = min(10000, int(limit))
    except (TypeError, ValueError):
        q['size'] = 30

    if q['from'] > 0:
        # When requesting a second page of the results, the client will not
        # need to be returned facet results a second time.
        del q['aggregations']
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
        'facets': convert_aggregations(result, args.getlist('facet'))
    }
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
