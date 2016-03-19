import re
from copy import deepcopy

from aleph import authz

MARKS = re.compile(r'[_\.;,/]{2,}')


def authz_filter(q):
    return add_filter(q, {
        "terms": {"source_id": list(authz.sources(authz.READ))}
    })


def add_filter(q, filter_):
    """Add the given filter ``filter_`` to the given query."""
    q = deepcopy(q)
    if 'filtered' not in q:
        return {
            'filtered': {
                'query': q,
                'filter': filter_
            }
        }

    if 'and' in q['filtered']['filter']:
        q['filtered']['filter']['and'].append(filter_)
    else:
        q['filtered']['filter'] = \
            {'and': [filter_, q['filtered']['filter']]}
    return q


def clean_highlight(hlt):
    hlt = MARKS.sub('.', hlt)
    return hlt.strip()


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
