from aleph.core import es
from aleph.model import Entity
from aleph.index.util import authz_query
from aleph.index.core import entities_index


def get_instance_stats(authz):
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [
                    authz_query(authz),
                    {'term': {'schemata': Entity.THING}}
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

    return data
