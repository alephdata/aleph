import logging
from pprint import pprint  # noqa
from normality import normalize
from followthemoney import types

from aleph.core import es
from aleph.model import Entity, Collection
from aleph.index.core import collections_index, entities_index, records_index
from aleph.index.util import query_delete, unpack_result, index_safe
from aleph.index.util import index_form, search_safe

log = logging.getLogger(__name__)


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
        'category': Collection.DEFAULT,
        'publisher': collection.publisher,
        'publisher_url': collection.publisher_url,
        'info_url': collection.info_url,
        'data_url': collection.data_url,
        'casefile': collection.casefile,
        'collection_id': collection.id,
        'schemata': {},
        'team': []
    }
    texts = [v for v in data.values() if isinstance(v, str)]

    if collection.category in Collection.CATEGORIES:
        data['category'] = collection.category

    if collection.creator is not None:
        data['creator'] = {
            'id': collection.creator.id,
            'type': collection.creator.type,
            'name': collection.creator.name
        }
        texts.append(collection.creator.name)

    for role in collection.team:
        data['team'].append({
            'id': role.id,
            'type': role.type,
            'name': role.name
        })
        texts.append(role.name)

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
    result = search_safe(index=entities_index(), body=query)
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
    data['countries'] = types.countries.normalize_set(countries)

    languages = collection.languages
    if languages is None or not len(languages):
        languages = aggregations['languages']['buckets']
        languages = [c['key'] for c in languages]
    data['languages'] = types.languages.normalize_set(languages)

    texts.extend([normalize(t, ascii=True) for t in texts])
    data['text'] = index_form(texts)
    return index_safe(collections_index(), collection.id, data)


def get_collection(collection_id):
    """Fetch a collection from the index."""
    result = es.get(index=collections_index(),
                    doc_type='doc',
                    id=collection_id,
                    ignore=[404],
                    _source_exclude=['text'])
    return unpack_result(result)


def delete_collection(collection_id):
    """Delete all documents from a particular collection."""
    q = {'ids': {'values': str(collection_id)}}
    query_delete(collections_index(), q)


def delete_entities(collection_id):
    """Delete entities from a collection."""
    query = {'bool': {
        'must_not': {'term': {'schemata': 'Document'}},
        'must': {'term': {'collection_id': collection_id}}
    }}
    query_delete(entities_index(), query)


def delete_documents(collection_id):
    """Delete documents from a collection."""
    records_query = {'term': {'collection_id': collection_id}}
    query_delete(records_index(), records_query)
    query = {'bool': {
        'must': [
            {'term': {'schemata': 'Document'}},
            {'term': {'collection_id': collection_id}}
        ]
    }}
    query_delete(entities_index(), query)
