from pprint import pprint  # noqa

from aleph.index import TYPE_LINK
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query, authz_filter
from aleph.search.fragments import add_filter, aggregate
from aleph.search.facet import parse_facet_result

DEFAULT_FIELDS = ['roles', 'remote', 'origin', 'inverted', 'schema',
                  'schemata', 'properties']


def links_query(origin, state):
    """Parse a user query string, compose and execute a query."""
    if state.has_text:
        q = {
            "query_string": {
                "query": state.text,
                "fields": ['name^5', 'names^2', 'text'],
                "default_operator": "AND",
                "use_dis_max": True
            }
        }
    else:
        q = match_all()
    ids = origin.get('ids') or [origin.get('id')]
    q = add_filter(q, {'terms': {'origin.id': ids}})
    q = authz_filter(q, state.authz, roles=True)

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    aggs = aggregate(state, q, aggs, state.facet_names)

    if state.sort == 'score':
        sort = ['_score']
    else:
        sort = [{'properties.start_date': 'desc'},
                {'properties.end_date': 'desc'}]

    q = {
        'sort': sort,
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        'size': state.limit,
        'from': state.offset,
        '_source': DEFAULT_FIELDS
    }

    result, hits, output = execute_basic(TYPE_LINK, q)
    output['facets'] = parse_facet_result(state, result)
    for doc in hits.get('hits', []):
        link = doc.get('_source')
        link['id'] = doc.get('_id')
        link['score'] = doc.get('_score')
        output['results'].append(link)
    return output
