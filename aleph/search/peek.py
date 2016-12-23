import math
from sqlalchemy import not_
from pprint import pprint  # noqa

from aleph.index import TYPE_DOCUMENT
from aleph.core import es, es_index
from aleph.model import Collection
from aleph.search.fragments import text_query, filter_query


def round(x, factor):
    rnd = int(math.floor(x / float(factor))) * factor
    return 'More than %s' % format(rnd, '0,.0f')


def format_total(obj):
    total = obj.pop('total', 0)
    if total == 0:
        total = 'No'
    elif total < 15:
        total = 'Some'
    elif total < 100:
        total = round(total, 10)
    elif total < 1000:
        total = round(total, 100)
    else:
        total = round(total, 1000)
    obj['total'] = total
    return obj


def peek_query(state):
    """Peek into hidden collections.

    This allows users to retrieve an approximate result count of a given query
    against those collections which they are not authorised to view. It is a
    rudimentary collaboration mechanism.
    """
    filters = state.filters
    cq = Collection.all()
    cq = cq.filter(not_(Collection.id.in_(state.authz.collections_read)))
    cq = cq.filter(Collection.creator_id != None)  # noqa
    cq = cq.filter(Collection.private != True)  # noqa
    collections = {c.id: c for c in cq}
    filters['collection_id'] = collections.keys()

    q = text_query(state.text)
    q = {
        'query': filter_query(q, filters),
        'query': q,
        'size': 0,
        'aggregations': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': 1000}
            }
        },
        '_source': False
    }
    result = es.search(index=es_index, body=q, doc_type=TYPE_DOCUMENT)
    roles = {}
    total = 0
    aggs = result.get('aggregations', {}).get('collections', {})
    for bucket in aggs.get('buckets', []):
        collection = collections.get(bucket.get('key'))
        if collection is None or collection.creator is None:
            continue
        total += bucket.get('doc_count')
        if collection.creator_id in roles:
            roles[collection.creator_id]['total'] += bucket.get('doc_count')
        else:
            roles[collection.creator_id] = {
                'name': collection.creator.name,
                'email': collection.creator.email,
                'total': bucket.get('doc_count')
            }

    roles = sorted(roles.values(), key=lambda r: r['total'], reverse=True)
    roles = [format_total(r) for r in roles]
    return format_total({
        'roles': roles,
        'active': total > 0,
        'total': total
    })
