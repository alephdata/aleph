from aleph.core import es
from aleph.index.core import entity_type, entity_index, entities_index


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
                       doc_type=entity_type(),
                       body=query)
    aggregations = result.get('aggregations')
    data = {
        'total': result.get('hits').get('total'),
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
            'term': {
                'collection_id': collection_id
            }
        },
        'aggs': {
            'schema': {'terms': {'field': 'schema', 'size': 1000}},
            'countries': {'terms': {'field': 'countries', 'size': 250}},
            'languages': {'terms': {'field': 'languages', 'size': 100}},
        }
    }
    result = es.search(index=entity_index(),
                       doc_type=entity_type(),
                       body=query)
    aggregations = result.get('aggregations')
    data = {
        'schemata': {},
        'total': result.get('hits').get('total')
    }

    # expose entities by schema count.
    for schema in aggregations.get('schema').get('buckets'):
        key = schema.get('key')
        count = schema.get('doc_count')
        data['schemata'][key] = count

    # if no countries or langs are given, take the most common from the data.
    if not data.get('countries') or not len(data.get('countries')):
        countries = aggregations.get('countries').get('buckets')
        data['countries'] = [c.get('key') for c in countries]

    if not data.get('languages') or not len(data.get('languages')):
        countries = aggregations.get('languages').get('buckets')
        data['languages'] = [c.get('key') for c in countries]

    # pprint(data)
    return data
