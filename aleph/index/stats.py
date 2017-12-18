from aleph.core import es
from aleph.index.core import entities_index


def get_instance_stats(authz):
    query = {
        'size': 0,
        'query': {
            'terms': {
                'roles': list(authz.roles)
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


def get_collection_stats(collection_id):
    """Compute some statistics on the content of a collection."""
    query = {
        'size': 0,
        'query': {
            'term': {'collection_id': collection_id}
        },
        'aggs': {
            'schema': {'terms': {'field': 'schema', 'size': 1000}},
            'countries': {'terms': {'field': 'countries', 'size': 500}},
            'languages': {'terms': {'field': 'languages', 'size': 100}},
        }
    }
    result = es.search(index=entities_index(), body=query)
    aggregations = result.get('aggregations')
    data = {
        'schemata': {},
        'count': result['hits']['total']
    }

    # expose entities by schema count.
    for schema in aggregations['schema']['buckets']:
        data['schemata'][schema['key']] = schema['doc_count']

    # if no countries or langs are given, take the most common from the data.
    if not len(data.get('countries', [])):
        countries = aggregations['countries']['buckets']
        data['countries'] = [c['key'] for c in countries]

    if not len(data.get('languages', [])):
        countries = aggregations['languages']['buckets']
        data['languages'] = [c['key'] for c in countries]

    # pprint(data)
    return data
