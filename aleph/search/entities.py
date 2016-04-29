from pprint import pprint  # noqa

from werkzeug.datastructures import MultiDict

from aleph.core import url_for
from aleph.index import TYPE_ENTITY
from aleph.search.util import authz_collections_filter
from aleph.search.util import execute_basic, parse_filters
from aleph.search.fragments import match_all, filter_query, aggregate
from aleph.search.facets import convert_entity_aggregations

DEFAULT_FIELDS = ['collection_id', 'name', 'summary', 'jurisdiction_code',
                  'description', '$schema']

# Scoped facets are facets where the returned facet values are returned such
# that any filter against the same field will not be applied in the sub-query
# used to generate the facet values.
OR_FIELDS = ['collection_id']


def entities_query(args, fields=None, facets=True):
    """Parse a user query string, compose and execute a query."""
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    text = args.get('q', '').strip()
    if text is None or not len(text):
        q = match_all()
    else:
        q = {
            "query_string": {
                "query": text,
                "fields": ['name^15', 'name_latin^5',
                           'summary^10', 'summary_latin^7',
                           'description^5', 'description_latin^3'],
                "default_operator": "AND",
                "use_dis_max": True
            }
        }

    q = authz_collections_filter(q)
    filters = parse_filters(args)
    aggs = {}
    if facets:
        aggs = aggregate(q, args)
        aggs = facet_collection(q, aggs, filters)

    return {
        'sort': ['_score'],
        'query': filter_query(q, filters, OR_FIELDS),
        'aggregations': aggs,
        '_source': fields or DEFAULT_FIELDS
    }


def facet_collection(q, aggs, filters):
    aggs['scoped']['aggs']['collection'] = {
        'filter': {
            'query': filter_query(q, filters, OR_FIELDS, skip='collection_id')
        },
        'aggs': {
            'collection': {
                'terms': {'field': 'collection_id', 'size': 1000}
            }
        }
    }
    return aggs


def execute_entities_query(args, query):
    """Execute the query and return a set of results."""
    result, hits, output = execute_basic(TYPE_ENTITY, query)
    convert_entity_aggregations(result, output, args)
    for doc in hits.get('hits', []):
        document = doc.get('_source')
        document['id'] = doc.get('_id')
        document['score'] = doc.get('_score')
        document['api_url'] = url_for('entities_api.view', id=doc.get('_id'))
        output['results'].append(document)
    return output
