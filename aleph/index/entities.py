import logging
import fingerprints
from pprint import pprint  # noqa
from itertools import count
from banal import clean_dict, ensure_list
from datetime import datetime
from followthemoney import model
from elasticsearch.helpers import scan, BulkIndexError
from elasticsearch import TransportError
from normality import latinize_text

from aleph.core import es
from aleph.index.core import entity_index, entities_index, entities_index_list
from aleph.index.util import bulk_op, unpack_result, index_form, query_delete
from aleph.index.util import index_safe, search_safe, backoff_cluster
from aleph.index.util import authz_query

log = logging.getLogger(__name__)


def index_entity(entity):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)

    data = {
        'name': entity.name,
        'foreign_id': entity.foreign_id,
        'properties': {
            'name': [entity.name]
        }
    }

    for prop, values in entity.data.items():
        values = ensure_list(values)
        if len(values):
            data['properties'][prop] = values

    return index_single(entity, data, [])


def get_entity(entity_id):
    """Fetch an entity from the index."""
    if entity_id is None:
        return None
    for index in entities_index_list():
        result = es.get(index=index,
                        doc_type='doc',
                        id=entity_id,
                        ignore=[404],
                        _source_exclude=['text'])
        result = unpack_result(result)
        if result is not None:
            return result


def iter_entities(authz=None, collection_id=None, schemata=None,
                  includes=None, excludes=None):
    """Scan all entities matching the given criteria."""
    filters = []
    if authz is not None:
        filters.append(authz_query(authz))
    if collection_id is not None:
        filters.append({'term': {'collection_id': collection_id}})
    if ensure_list(schemata):
        filters.append({'terms': {'schemata': ensure_list(schemata)}})
    source = {}
    if ensure_list(includes):
        source['includes'] = ensure_list(includes)
    if ensure_list(excludes):
        source['excludes'] = ensure_list(excludes)
    query = {
        'query': {'bool': {'filter': filters}},
        'sort': ['_doc'],
        '_source': source
    }
    for res in scan(es, index=entities_index(), query=query, scroll='1410m'):
        yield unpack_result(res)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    q = {'ids': {'values': str(entity_id)}}
    query_delete(entities_index(), q)


def _index_updates(collection, entities):
    """Look up existing index documents and generate an updated form.

    This is necessary to make the index accumulative, i.e. if an entity or link
    gets indexed twice with different field values, it'll add up the different
    field values into a single record. This is to avoid overwriting the
    document and losing field values. An alternative solution would be to
    implement this in Groovy on the ES.
    """
    common = {
        'collection_id': collection.id,
        'bulk': True,
        'roles': collection.roles,
        'updated_at': datetime.utcnow()
    }
    if not len(entities):
        return

    query = {
        'query': {'ids': {'values': list(entities.keys())}},
        '_source': ['schema', 'properties', 'created_at']
    }
    result = search_safe(index=entity_index(),
                         body=query)
    for doc in result.get('hits').get('hits', []):
        entity_id = doc['_id']
        entity = entities.get(entity_id)
        existing = doc.get('_source')
        combined = model.merge(existing, entity)
        combined['created_at'] = existing.get('created_at')
        entities[entity_id] = combined

    for doc_id, entity in entities.items():
        entity.pop('id', None)
        entity.update(common)
        schema = model.get(entity.get('schema'))
        entity = finalize_index(entity, schema, [])
        # pprint(entity)
        yield {
            '_id': doc_id,
            '_index': entity_index(),
            '_type': 'doc',
            '_source': entity
        }


def index_bulk(collection, entities, chunk_size=200):
    """Index a set of entities."""
    for attempt in count(1):
        try:
            entities = _index_updates(collection, entities)
            bulk_op(entities, chunk_size=chunk_size)
            return
        except (BulkIndexError, TransportError) as exc:
            log.warning('Indexing error: %s', exc)
        backoff_cluster(failures=attempt)


def finalize_index(data, schema, texts):
    """Apply final denormalisations to the index."""
    data['schema'] = schema.name
    # Get implied schemata (i.e. parents of the actual schema)
    data['schemata'] = schema.names

    properties = data.get('properties', {})
    for name, prop in schema.properties.items():
        if name not in properties:
            continue
        for value in ensure_list(properties[name]):
            if name == 'name':
                data['name'] = value
            texts.append(value)

    data = schema.invert(data)
    data['text'] = index_form(texts)

    names = data.get('names', [])
    fps = [fingerprints.generate(name) for name in names]
    fps = [fp for fp in fps if fp is not None]
    data['fingerprints'] = list(set(fps))

    # Add latinised names
    for name in list(names):
        names.append(latinize_text(name))
    data['names'] = list(set(names))

    if 'created_at' not in data:
        data['created_at'] = data.get('updated_at')
    return data


def index_single(obj, data, texts):
    """Indexing aspects common to entities and documents."""
    data['bulk'] = False
    data['roles'] = obj.collection.roles
    data['collection_id'] = obj.collection.id
    data['created_at'] = obj.created_at
    data['updated_at'] = obj.updated_at
    data = finalize_index(data, obj.model, texts)
    data = clean_dict(data)
    # pprint(data)
    return index_safe(entity_index(), obj.id, data)
