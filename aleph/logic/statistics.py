from aleph.core import es, cache
from aleph.index.util import authz_query
from aleph.index.core import entities_index, collections_index


def get_instance_stats(authz):
    key = cache.key('stats', authz.id)
    stats = cache.get_complex(key)
    if stats is not None:
        return stats
    # Compute entity stats:
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [authz_query(authz)]
            }
        }
    }
    entities = es.search(index=entities_index(), body=query)

    # Compute collection stats (should we return categories?)
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [authz_query(authz)]
            }
        }
    }
    collections = es.search(index=collections_index(), body=query)
    stats = {
        'entities': entities.get('hits').get('total'),
        'collections': collections.get('hits').get('total')
    }
    cache.set_complex(key, stats, expire=600)
    return stats
