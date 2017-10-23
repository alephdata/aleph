from __future__ import absolute_import

import time
import logging
from pprint import pprint  # noqa
from followthemoney import model
from datetime import datetime
from elasticsearch.helpers import BulkIndexError
from elasticsearch import TransportError

from aleph.core import es, es_index
from aleph.model import Entity
from aleph.index.mapping import TYPE_ENTITY
from aleph.index.util import bulk_op, index_form
from aleph.index.util import index_names, unpack_result
from aleph.util import ensure_list

log = logging.getLogger(__name__)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    es.delete(index=es_index, doc_type=TYPE_ENTITY, id=entity_id, ignore=[404])


def index_entity(entity):
    """Index an entity."""
    if entity.state != Entity.STATE_ACTIVE:
        return delete_entity(entity.id)

    data = {
        'type': entity.type,
        'state': entity.state,
        'foreign_ids': entity.foreign_ids,
        'data': entity.data,
        'created_at': entity.created_at,
        'updated_at': entity.updated_at,
        '$bulk': False,
        'roles': entity.collection.roles,
        'collection_id': entity.collection_id,
        'properties': {
            'name': [entity.name]
        }
    }

    for k, v in entity.data.items():
        v = ensure_list(v)
        if len(v):
            data['properties'][k] = v

    # data['$documents'] = get_count(entity)
    data = finalize_index(data, entity.schema)
    es.index(index=es_index,
             doc_type=TYPE_ENTITY,
             id=entity.id,
             body=data)
    data['id'] = entity.id
    data['$type'] = TYPE_ENTITY
    return data


def get_entity(entity_id):
    """Fetch an entity from the index."""
    result = es.get(index=es_index,
                    doc_type=TYPE_ENTITY,
                    id=entity_id,
                    ignore=[404])
    entity = unpack_result(result)
    if entity is not None:
        entity.pop('text', None)
    return entity


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
        '$bulk': True,
        'state': Entity.STATE_ACTIVE,
        'roles': collection.roles,
        'updated_at': datetime.utcnow()
    }
    if not len(entities):
        return

    result = es.mget(index=es_index, doc_type=TYPE_ENTITY,
                     body={'ids': entities.keys()},
                     _source=['schema', 'properties', 'created_at'])
    for doc in result.get('docs', []):
        if not doc.get('found', False):
            continue
        entity_id = doc['_id']
        entity = entities.get(entity_id)
        existing = doc.get('_source')
        combined = model.merge(existing, entity)
        combined['created_at'] = existing.get('created_at')
        entities[entity_id] = combined

    for doc_id, entity in entities.items():
        entity.pop('id', None)
        entity.pop('data', None)
        entity.update(common)
        if 'created_at' not in entity:
            entity['created_at'] = entity.get('updated_at')
        schema = model.get(entity.get('schema'))
        if schema is None:
            pprint(entity)
        entity = finalize_index(entity, schema)
        # pprint(entity)
        yield {
            '_id': doc_id,
            '_type': TYPE_ENTITY,
            '_index': str(es_index),
            '_source': entity
        }


def index_bulk(collection, entities, chunk_size=500):
    """Index a set of entities."""
    while True:
        try:
            bulk_op(_index_updates(collection, entities),
                    chunk_size=chunk_size)
            break
        except (BulkIndexError, TransportError) as exc:
            log.warning('Indexing error: %s', exc)
            time.sleep(10)


def finalize_index(data, schema):
    """Apply final denormalisations to the index."""
    properties = data.get('properties', {})

    texts = []
    for vs in properties.values():
        for v in ensure_list(vs):
            texts.append(v)

    data['text'] = index_form(texts)

    # Generate inverted representations of the data stored in properties.
    for prop in schema.properties:
        values = properties.get(prop.name, [])
        if not len(values):
            continue

        # Find an set the name property
        if prop.is_label:
            data['name'] = values[0]

        # Add inverted properties. This takes all the properties
        # of a specific type (names, dates, emails etc.)
        invert = prop.type.index_invert
        if invert:
            if invert not in data:
                data[invert] = []
            for norm in prop.type.normalize(values):
                if norm not in data[invert]:
                    data[invert].append(norm)

    index_names(data)

    # Get implied schemata (i.e. parents of the actual schema)
    data['schema'] = schema.name
    data['schemata'] = [p.name for p in schema.schemata if not p.hidden]

    # Second name field for non-tokenised sorting.
    if 'name' in data:
        data['name_sort'] = data.get('name')

    # pprint(data)
    return data
