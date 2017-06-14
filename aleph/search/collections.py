from pprint import pprint  # noqa

from aleph.core import url_for
from aleph.index import TYPE_COLLECTION
from aleph.search.util import execute_basic
from aleph.search.fragments import match_all, filter_query
from aleph.search.fragments import aggregate, authz_filter
from aleph.search.facet import parse_facet_result


def collections_query(state, fields=None):
    """Parse a user query string, compose and execute a query."""
    if state.has_text:
        q = {
            "query_string": {
                "query": state.text,
                "fields": ['label^5', 'summary^2'],
                "default_operator": "AND",
                "use_dis_max": True
            }
        }
    else:
        q = match_all()

    q = authz_filter(q, state.authz, roles=True)
    facets = list(state.facet_names)
    aggs = aggregate(state, q, {}, facets)

    if state.sort == 'score':
        sort = ['_score', {'name_sort': 'asc'}]
    else:
        sort = [{'$total': 'desc'}]

    # pprint(q)
    q = {
        'sort': sort,
        'query': filter_query(q, state.filters),
        'aggregations': aggs,
        'size': state.limit,
        'from': state.offset
    }

    result, hits, output = execute_basic(TYPE_COLLECTION, q)
    output['facets'] = parse_facet_result(state, result)
    for doc in hits.get('hits', []):
        collection = doc.get('_source')
        collection['id'] = doc.get('_id')
        collection['score'] = doc.get('_score')
        collection['api_url'] = url_for('collections_api.view',
                                        id=doc.get('_id'))
        output['results'].append(collection)
    return output
