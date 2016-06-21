from werkzeug.datastructures import MultiDict

from aleph import authz
from aleph.index import TYPE_DOCUMENT
from aleph.core import get_es, get_es_index
from aleph.model import Collection
from aleph.search.documents import text_query
from aleph.search.fragments import filter_query
from aleph.search.util import parse_filters, add_filter


def peek_query(args):
    if not isinstance(args, MultiDict):
        args = MultiDict(args)
    text = args.get('q', '').strip()
    q = text_query(text)

    filters = parse_filters(args)
    for entity in args.getlist('entity'):
        filters.append(('entities.id', entity))

    q = filter_query(q, filters, [])
    q = add_filter(q, {
        'not': {
            'terms': {
                'collection_id': authz.collections(authz.READ)
            }
        }
    })
    q = {
        'query': q,
        'size': 0,
        'aggregations': {
            'collections': {
                'terms': {'field': 'collection_id', 'size': 30}
            }
        },
        '_source': False
    }
    result = get_es().search(index=get_es_index(), body=q,
                             doc_type=TYPE_DOCUMENT)

    aggs = result.get('aggregations', {}).get('collections', {})
    buckets = aggs.get('buckets', [])
    q = Collection.all_by_ids([b['key'] for b in buckets])
    q = q.filter(Collection.creator_id != None)  # noqa
    objs = {o.id: o for o in q.all()}
    roles = {}
    for bucket in buckets:
        collection = objs.get(bucket.get('key'))
        if collection is None:
            continue
        if collection.creator_id in roles:
            roles[collection.creator_id]['count'] += bucket.get('doc_count')
        else:
            roles[collection.creator_id] = {
                'name': collection.creator.name,
                'email': collection.creator.email,
                'count': bucket.get('doc_count')
            }
    return {
        'roles': sorted(roles.values(), key=lambda r: r['count']),
        'total': result.get('hits', {}).get('total')
    }
