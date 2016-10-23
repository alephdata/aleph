import re
from copy import deepcopy

from aleph import authz
from aleph.core import get_es, get_es_index

MARKS = re.compile(r'[_\.;,/]{2,}')
FACET_SIZE = 50


def authz_filter(q):
    return add_filter(q, {
        "terms": {"collection_id": list(authz.collections(authz.READ))}
    })


def add_filter(q, filter_):
    """Add the given filter ``filter_`` to the given query."""
    q = deepcopy(q)
    if 'filtered' not in q:
        q = {
            'filtered': {
                'query': q,
                'filter': {'bool': {'must': []}}
            }
        }
    q['filtered']['filter']['bool']['must'].append(filter_)
    return q


def clean_highlight(hlt):
    hlt = MARKS.sub('.', hlt)
    return hlt.strip()


def parse_filters(state):
    # Extract filters, given in the form: &filter:foo_field=bla_value
    filters = []
    for key in state.args.keys():
        for value in state.getlist(key):
            if not key.startswith('filter:'):
                continue
            _, field = key.split(':', 1)
            filters.append((field, value))
    return filters


def execute_basic(doc_type, query):
    """Common part of running a particular query."""
    result = get_es().search(index=get_es_index(), doc_type=doc_type,
                             body=query)
    hits = result.get('hits', {})
    output = {
        'status': 'ok',
        'results': [],
        'offset': query.get('from', 0),
        'limit': query.get('size'),
        'total': hits.get('total'),
        'next': None
    }
    return result, hits, output


def next_params(args, result):
    """Get the parameters for making a next link."""
    next_offset = result['offset'] + result['limit']
    if result['total'] > next_offset:
        params = {'offset': next_offset}
        for k, v in args.iterlists():
            if k in ['offset']:
                continue
            params[k] = v
        return params
