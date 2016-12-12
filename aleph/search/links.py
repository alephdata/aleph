from pprint import pprint  # noqa

from aleph.index import TYPE_LINK
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query
from aleph.search.fragments import add_filter, aggregate
from aleph.search.facet import parse_facet_result

DEFAULT_FIELDS = ['roles', 'remote', 'origin', 'inverted', 'schema',
                  'schemata', 'properties']


def entity_authz_filter(q, authz):
    return add_filter(q, {
        "or": [
            {'terms': {'roles': list(authz.roles)}},
            {'terms': {'collection_id': list(authz.collections_read)}},
        ]
    })


def links_query(origin_id, state):
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
    q = add_filter(q, {'term': {'origin.id': origin_id}})
    q = add_filter(q, {'terms': {'roles': list(state.authz.roles)}})

    aggs = {'scoped': {'global': {}, 'aggs': {}}}
    aggs = aggregate(q, aggs, state.facet_names)

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
