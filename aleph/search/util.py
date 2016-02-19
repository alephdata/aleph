from copy import deepcopy

from aleph import authz


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
