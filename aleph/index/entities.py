import logging
import fingerprints
from pprint import pprint  # noqa
from banal import clean_dict, ensure_list
from datetime import datetime
from followthemoney import model
from followthemoney.util import merge_data
from elasticsearch.helpers import scan, BulkIndexError

from aleph.core import es
from aleph.index.core import entity_index, entities_index, entities_index_list
from aleph.index.util import bulk_op, unpack_result, index_form, query_delete
from aleph.index.util import index_safe, search_safe, authz_query

log = logging.getLogger(__name__)


def index_entity(entity):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)

    context = {'foreign_id': entity.foreign_id}
    return index_single(entity, entity.to_proxy(), context, [])


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
    timestamps = {}
    if not len(entities):
        return [] 

    query = {
        'query': {'ids': {'values': list(entities.keys())}},
        '_source': {'includes': ['schema', 'properties', 'created_at']},
        'size': len(entities) * 2
    }
    result = search_safe(index=entity_index(), body=query)
    for doc in result.get('hits').get('hits', []):
        result = unpack_result(doc)
        existing = model.get_proxy(result)
        entities[existing.id].merge(existing)
        timestamps[existing.id] = result.get('created_at')

    actions = []
    for entity_id, entity in entities.items():
        context = dict(common)
        context['created_at'] = timestamps.get(entity.id)
        entity = finalize_index(entity, context, [])
        # pprint(entity)
        actions.append({
            '_id': entity_id,
            '_index': entity_index(),
            '_type': 'doc',
            '_source': entity
        })
    return actions


def index_bulk(collection, entities):
    """Index a set of entities."""
    actions = _index_updates(collection, entities)
    chunk_size = len(actions) + 1
    try:
        bulk_op(actions,
                chunk_size=chunk_size,
                refresh='wait_for')
    except BulkIndexError as exc:
        log.warning('Indexing error: %s', exc)


def finalize_index(proxy, context, texts):
    """Apply final denormalisations to the index."""
    for prop, value in proxy.itervalues():
        if prop.type.name in ['entity', 'date', 'url', 'country', 'language']:
            continue
        texts.append(value)

    entity = proxy.to_full_dict()
    data = merge_data(context, entity)
    data['name'] = proxy.caption
    data['text'] = index_form(texts)

    names = data.get('names', [])
    fps = [fingerprints.generate(name) for name in names]
    fps = [fp for fp in fps if fp is not None]
    data['fingerprints'] = list(set(fps))

    if not data.get('created_at'):
        data['created_at'] = data.get('updated_at')
    data.pop('id', None)
    return clean_dict(data)


def index_single(obj, proxy, data, texts):
    """Indexing aspects common to entities and documents."""
    data = finalize_index(proxy, data, texts)
    data['bulk'] = False
    data['roles'] = obj.collection.roles
    data['collection_id'] = obj.collection.id
    data['created_at'] = obj.created_at
    data['updated_at'] = obj.updated_at
    # pprint(data)
    return index_safe(entity_index(), obj.id, data)
