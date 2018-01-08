from pprint import pprint  # noqa

from aleph.core import es
from aleph.model import Entity
from aleph.index.core import collection_index, collections_index
from aleph.index.core import entities_index, entity_index
from aleph.index.core import records_index
from aleph.index.util import query_delete, unpack_result


def index_collection(collection):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    data = {
        'foreign_id': collection.foreign_id,
        'created_at': collection.created_at,
        'updated_at': collection.updated_at,
        'label': collection.label,
        'summary': collection.summary,
        'category': collection.category,
        'countries': collection.countries,
        'languages': collection.languages,
        'managed': collection.managed,
        'roles': collection.roles,
        'schemata': {}
    }

    if collection.creator is not None:
        data['creator'] = {
            'id': collection.creator.id,
            'type': collection.creator.type,
            'name': collection.creator.name
        }

    # Compute some statistics on the content of a collection.
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [
                    {'term': {'collection_id': collection.id}},
                    {'term': {'schemata': Entity.THING}}
                ]
            }
        },
        'aggs': {
            'schema': {'terms': {'field': 'schema', 'size': 1000}},
            'countries': {'terms': {'field': 'countries', 'size': 500}},
            'languages': {'terms': {'field': 'languages', 'size': 100}},
        }
    }
    result = es.search(index=entities_index(), body=query)
    aggregations = result.get('aggregations')
    data['count'] = result['hits']['total']

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

    es.index(index=collection_index(),
             doc_type='doc',
             id=collection.id,
             body=data)


def get_collection(collection_id):
    """Fetch a collection from the index."""
    result = es.get(index=collections_index(),
                    doc_type='doc',
                    id=collection_id,
                    ignore=[404],
                    _source_exclude=['text'])
    return unpack_result(result)


def update_roles(collection):
    """Update the role visibility of objects which are part of collections."""
    roles = ', '.join([str(r) for r in collection.roles])
    body = {
        'query': {'term': {'collection_id': collection.id}},
        'script': {
            'inline': 'ctx._source.roles = [%s]' % roles
        }
    }
    es.update_by_query(index=entity_index(),
                       body=body,
                       wait_for_completion=False)


def delete_collection(collection_id, wait=True):
    """Delete all documents from a particular collection."""
    query = {'term': {'collection_id': collection_id}}
    query_delete(records_index(), query, wait=wait)
    query_delete(entities_index(), query, wait=wait)
    es.delete(index=collections_index(),
              doc_type='doc',
              id=collection_id,
              ignore=[404])
