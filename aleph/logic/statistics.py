import logging

from aleph.core import es, cache
from aleph.model import Entity
from aleph.index.util import authz_query
from aleph.index.core import entities_index, collections_index

log = logging.getLogger(__name__)


@cache.memoize(3600 * 2)
def get_instance_stats(authz):
    # Compute entity stats:
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [
                    authz_query(authz),
                    # {'term': {'schemata': Entity.THING}}
                ]
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
    log.debug("Generated stats for %r.", authz_query(authz))
    return {
        'entities': entities.get('hits').get('total'),
        'collections': collections.get('hits').get('total')
    }
