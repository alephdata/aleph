import logging

from aleph.core import es, cache
# from aleph.model import Entity
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
        },
        'aggs': {
            'schema': {'terms': {'field': 'schema', 'size': 1000}}
        }
    }
    result = es.search(index=entities_index(),
                       body=query)
    aggregations = result.get('aggregations')
    data = {
        'count': result.get('hits').get('total'),
        'schemata': {}
    }
    for schema in aggregations.get('schema').get('buckets'):
        key = schema.get('key')
        data['schemata'][key] = schema.get('doc_count')

    # Compute collection stats (should we return categories?)
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [authz_query(authz)]
            }
        }
    }
    result = es.search(index=collections_index(),
                       body=query)
    data['collections'] = result.get('hits').get('total')
    log.debug("Generated stats for %r.", authz_query(authz))
    return data
