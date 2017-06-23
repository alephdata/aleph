from __future__ import absolute_import

import time
import logging
import fingerprints
from pprint import pprint  # noqa
from normality import ascii_text
from elasticsearch.helpers import BulkIndexError
from elasticsearch import TransportError

from aleph.core import es, es_index, schemata
from aleph.model import Entity
from aleph.index.mapping import TYPE_ENTITY, TYPE_LINK
from aleph.index.util import merge_docs, bulk_op, index_form
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
        'name': entity.name,
        'names': [entity.name],
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


def get_entity(entity_id):
    """Fetch an entity from the index."""
    result = es.get(index=es_index,
                    doc_type=TYPE_ENTITY,
                    id=entity_id,
                    ignore=[404])
    entity = result.get('_source', {})
    if result.get('found'):
        entity.pop('text', None)
        entity['id'] = result.get('_id')
        return entity


def _index_updates(entities, links):
    """Look up existing index documents and generate an updated form.

    This is necessary to make the index accumulative, i.e. if an entity or link
    gets indexed twice with different field values, it'll add up the different
    field values into a single record. This is to avoid overwriting the
    document and losing field values. An alternative solution would be to
    implement this in Groovy on the ES.
    """
    if not len(entities):
        return

    result = es.mget(index=es_index, doc_type=TYPE_ENTITY,
                     body={'ids': entities.keys()})
    for doc in result.get('docs', []):
        if not doc.get('found', False):
            continue
        entity_id = doc['_id']
        entity = entities.get(entity_id)
        existing = doc.get('_source')
        combined = merge_docs(entity, existing)
        combined['schema'] = schemata.merge_entity_schema(entity['schema'],
                                                          existing['schema'])
        combined['roles'] = entity.get('roles', [])
        entities[entity_id] = combined

    for link in links:
        doc_id = link.pop('id', None)
        if doc_id is None:
            continue
        entity = entities.get(link.pop('remote'))
        if entity is None:
            continue
        entity = dict(entity)
        link['text'].extend(entity.pop('text', []))
        link['text'] = list(set(link['text']))
        link['remote'] = entity
        yield {
            '_id': doc_id,
            '_type': TYPE_LINK,
            '_index': str(es_index),
            '_source': link
        }

    for doc_id, entity in entities.items():
        entity.pop('id', None)
        # from pprint import pprint
        # pprint(entity)
        yield {
            '_id': doc_id,
            '_type': TYPE_ENTITY,
            '_index': str(es_index),
            '_source': entity
        }


def index_bulk(entities, links):
    """Index a set of links or entities."""
    while True:
        try:
            bulk_op(_index_updates(entities, links))
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

    names = data.get('names', [])
    fps = [fingerprints.generate(name) for name in names]
    fps = [fp for fp in fps if fp is not None]
    data['fingerprints'] = list(set(fps))

    # Add latinised names
    for name in list(names):
        names.append(ascii_text(name))
    data['names'] = list(set(names))

    # Get implied schemata (i.e. parents of the actual schema)
    data['schema'] = schema.name
    data['schemata'] = [p.name for p in schema.schemata if not p.hidden]

    # Second name field for non-tokenised sorting.
    if 'name' in data:
        data['name_sort'] = data.get('name')

    # pprint(data)
    return data
