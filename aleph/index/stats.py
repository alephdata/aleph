from aleph.core import es, es_index
from aleph.model import Document
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_ENTITY
from aleph.index.mapping import TYPE_COLLECTION

TYPES = {
    TYPE_DOCUMENT: '$documents',
    TYPE_ENTITY: '$entities',
    TYPE_COLLECTION: '$collections',
}


def get_instance_stats(authz):
    query = {
        'size': 0,
        'query': {
            'terms': {
                'roles': list(authz.roles)
            }
        },
        'aggs': {
            'schema': {'terms': {'field': 'schema', 'size': 1000}},
            'types': {'terms': {'field': '_type', 'size': len(TYPES)}}
        }
    }
    result = es.search(index=es_index,
                       doc_type=TYPES.keys(),
                       body=query)
    aggregations = result.get('aggregations')
    data = {
        '$total': result.get('hits').get('total'),
        '$schemata': {}
    }
    for schema in aggregations.get('schema').get('buckets'):
        key = schema.get('key')
        data['$schemata'][key] = schema.get('doc_count')

    for doc_type in aggregations.get('types').get('buckets'):
        key = TYPES.get(doc_type.get('key'))
        data[key] = doc_type.get('doc_count')
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
    result = es.search(index=es_index,
                       doc_type=[TYPE_DOCUMENT, TYPE_ENTITY],
                       body=query)
    aggregations = result.get('aggregations')
    data = {
        '$schemata': {},
        '$entities': 0,
        '$total': result.get('hits').get('total')
    }

    # expose both entities by schema count and totals for docs and entities.
    for schema in aggregations.get('schema').get('buckets'):
        key = schema.get('key')
        count = schema.get('doc_count')
        data['$schemata'][key] = count
        if key == Document.SCHEMA:
            data['$documents'] = count
        else:
            data['$entities'] += count

    # if no countries or langs are given, take the most common from the data.
    if not data.get('countries') or not len(data.get('countries')):
        countries = aggregations.get('countries').get('buckets')
        data['countries'] = [c.get('key') for c in countries]

    if not data.get('languages') or not len(data.get('languages')):
        countries = aggregations.get('languages').get('buckets')
        data['languages'] = [c.get('key') for c in countries]

    # pprint(data)
    return data
