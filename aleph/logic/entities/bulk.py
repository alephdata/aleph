import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.exc import InvalidData

from aleph.core import celery
from aleph.model import Collection
from aleph.index import entities as index
from aleph.index.util import BULK_PAGE
from aleph.logic.collections import refresh_collection
from aleph.util import dict_list

log = logging.getLogger(__name__)


def bulk_load(config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    from aleph.logic.collections import create_collection
    for foreign_id, data in config.items():
        data['foreign_id'] = foreign_id
        data['label'] = data.get('label', foreign_id)
        collection = create_collection(data)
        collection_id = collection.get('id')
        # FIXME: this does not perform collection metadata validation.
        for query in dict_list(data, 'queries', 'query'):
            bulk_load_query.apply_async([collection_id, query], priority=6)


@celery.task()
def bulk_load_query(collection_id, query):
    collection = Collection.by_id(collection_id)
    if collection is None:
        log.warning("Collection does not exist: %s", collection_id)
        return

    mapping = model.make_mapping(query, key_prefix=collection.foreign_id)
    records_total = len(mapping.source) or 'streaming'
    entities = {}
    entities_count = 0
    for records_index, record in enumerate(mapping.source.records, 1):
        for entity in mapping.map(record).values():
            # When loading from a tabular data source, we will often
            # encounter mappings where the same entity is emitted
            # multiple times in short sequence, e.g. when the data
            # describes all the directors of a single company.
            if entity.id in entities:
                entities[entity.id].merge(entity)
            else:
                entities[entity.id] = entity
                entities_count += 1

        if records_index > 0 and records_index % 1000 == 0:
            log.info("[%s] Loaded %s records (%s), %s entities...",
                     collection.foreign_id,
                     records_index,
                     records_total,
                     entities_count)

        if len(entities) >= BULK_PAGE:
            index.index_bulk(collection.id, entities)
            entities = {}

    index.index_bulk(collection.id, entities)
    refresh_collection(collection)


def bulk_write(collection, items):
    """Write a set of entities - given as raw dicts - to the index in bulk
    mode. This will perform validation but is dangerous as it means the
    application has no control over key generation and a few other aspects
    of building the entity.
    """
    entities = {}
    for item in items:
        if not is_mapping(item):
            raise InvalidData("Failed to read input data")

        entity = model.get_proxy(item)
        if entity.id is None:
            raise InvalidData("No ID for entity")

        if entity.id in entities:
            entities[entity.id].merge(entity)
        else:
            entities[entity.id] = entity

        if len(entities) >= BULK_PAGE:
            index.index_bulk(collection.id, entities)
            entities = {}

    if len(entities):
        index.index_bulk(collection.id, entities)
