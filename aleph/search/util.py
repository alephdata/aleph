import re
from copy import deepcopy
from elasticsearch.helpers import scan

from aleph.core import es, es_index

MARKS = re.compile(r'[_\.;,/]{2,}')


def add_filter(q, filter_):
    """Add the given filter ``filter_`` to the given query."""
    q = deepcopy(q)
    if 'bool' not in q:
        q = {'bool': {'must': [q]}}
    if 'filter' not in q['bool']:
        q['bool']['filter'] = []
    q['bool']['filter'].append(filter_)
    return q


def clean_highlight(hlt):
    hlt = MARKS.sub('.', hlt)
    return hlt.strip()


def execute_basic(doc_type, query):
    """Common part of running a particular query."""
    result = es.search(index=es_index, doc_type=doc_type, body=query)
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


def scan_iter(query, type):
    """Scan the results of a query. No pagination is applied."""
    return scan(es, query=query, index=es_index, doc_type=type)
