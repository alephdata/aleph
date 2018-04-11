import six
import exactitude
from pprint import pprint  # noqa
from normality import normalize

from aleph.core import es
from aleph.model import Entity
from aleph.index.core import collection_index, collections_index
from aleph.index.core import entities_index, entity_index
from aleph.index.core import records_index
from aleph.index.util import query_delete, unpack_result, index_form


def index_collection(collection):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    data = {
        'foreign_id': collection.foreign_id,
        'created_at': collection.created_at,
        'updated_at': collection.updated_at,
        'label': collection.label,
        'kind': collection.kind,
        'summary': collection.summary,
        'category': collection.category,
        'publisher': collection.publisher,
        'publisher_url': collection.publisher_url,
        'info_url': collection.info_url,
        'data_url': collection.data_url,
        'casefile': collection.casefile,
        'roles': collection.roles,
        'schemata': {},
    }
    texts = [v for v in data.values() if isinstance(v, six.string_types)]

    if collection.creator is not None:
        data['creator'] = {
            'id': collection.creator.id,
            'type': collection.creator.type,
            'name': collection.creator.name
        }
        texts.append(collection.creator.name)

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
    countries = collection.countries
    if countries is None or not len(countries):
        countries = aggregations['countries']['buckets']
        countries = [c['key'] for c in countries]
    data['countries'] = exactitude.countries.normalize_set(countries)

    languages = collection.languages
    if languages is None or not len(languages):
        languages = aggregations['languages']['buckets']
        languages = [c['key'] for c in languages]
    data['languages'] = exactitude.countries.normalize_set(countries)

    texts.extend([normalize(t, ascii=True) for t in texts])
    data['text'] = index_form(texts)
    es.index(index=collection_index(),
             doc_type='doc',
             id=collection.id,
             body=data)
    data['id'] = collection.id
    return data


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
    delete_entities(collection_id, wait=wait)
    delete_documents(collection_id, wait=wait)
    es.delete(index=collections_index(),
              doc_type='doc',
              id=collection_id,
              ignore=[404])


def delete_entities(collection_id, wait=True):
    """Delete entities from a collection."""
    query = {'bool': {
        'must_not': {'term': {'schemata': 'Document'}},
        'must': {'term': {'collection_id': collection_id}}
    }}
    query_delete(entities_index(), query, wait=wait)


def delete_documents(collection_id, wait=True):
    """Delete documents from a collection."""
    query = {'bool': {
        'must': [
            {'term': {'schemata': 'Document'}},
            {'term': {'collection_id': collection_id}}
        ]
    }}
    query_delete(entities_index(), query, wait=wait)
    records_query = {'term': {'collection_id': collection_id}}
    query_delete(records_index(), records_query, wait=wait)
