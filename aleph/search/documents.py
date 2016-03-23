import json
from pprint import pprint  # noqa
from collections import defaultdict

from werkzeug.datastructures import MultiDict

from aleph.core import get_es, get_es_index, url_for
from aleph import authz
from aleph.index import TYPE_RECORD, TYPE_DOCUMENT
from aleph.search.util import add_filter, authz_filter, clean_highlight
from aleph.search.util import execute_basic
from aleph.search.fragments import text_query_string, meta_query_string
from aleph.search.fragments import match_all, child_record
from aleph.search.facets import convert_aggregations
from aleph.search.records import records_query

DEFAULT_FIELDS = ['source_id', 'title', 'file_name', 'extension', 'languages',
                  'countries', 'source_url', 'created_at', 'updated_at',
                  'type', 'summary', 'keywords']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['source_id']


def documents_query(args, fields=None, facets=True, newer_than=None):
    """Parse a user query string, compose and execute a query."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    text = args.get('q', '').strip()
    q = text_query(text)
    q = authz_filter(q)

    if newer_than is not None:
        q = add_filter(q, {
            "range": {
                "created_at": {
                    "gt": newer_than
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
        q = entity_collections(q, aggs, args, filters)

    return {
        'sort': sort,
        'query': filter_query(q, filters),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def entity_collections(q, aggs, args, filters):
    """Filter entities, facet for collections."""
    entities = args.getlist('entity')
    collections = []
    readable = authz.collections(authz.READ)
    for collection_id in args.getlist('collection'):
        if authz.collection_read(collection_id):
            collections.append(int(collection_id))

    flt = {
        'or': [
            {
                'terms': {'entities.watchlist_id': collections}
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
                        'terms': {'field': 'entities.entity_id', 'size': 100}
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
    result, hits, output = execute_basic(TYPE_DOCUMENT, query)
    convert_aggregations(result, output, args)
    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        document['score'] = doc.get('_score')
        document['records'] = {'results': [], 'total': 0}

        sq = records_query(document['id'], args)
        if sq is not None:
            sub_queries.append(json.dumps({}))
            sub_queries.append(json.dumps(sq))

        document['api_url'] = url_for('documents_api.view',
                                      document_id=doc.get('_id'))
        document['data_url'] = url_for('documents_api.file',
                                       document_id=doc.get('_id'))
        output['results'].append(document)

    run_sub_queries(output, sub_queries)
    return output


def execute_documents_alert_query(args, query):
    """Execute the query and return a set of results."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    query['size'] = 50
    result, hits, output = execute_basic(TYPE_DOCUMENT, query)
    convert_aggregations(result, output, args)
    sub_queries = []
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = int(doc.get('_id'))
        for source in output['sources']['values']:
            if source['id'] == document['source_id']:
                document['source'] = source
        document['records'] = {'results': [], 'total': 0}

        sq = records_query(document['id'], args, size=1)
        if sq is not None:
            sub_queries.append(json.dumps({}))
            sub_queries.append(json.dumps(sq))
        output['results'].append(document)

    run_sub_queries(output, sub_queries)
    return output
