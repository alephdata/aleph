import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.pragma import remove_checksums
from followthemoney.namespace import Namespace

from aleph.queues import ingest_entity
from aleph.analysis import tag_entity
from aleph.index import entities as index
from aleph.model import Entity, Document
from aleph.logic.collections import refresh_collection
from aleph.logic.aggregator import get_aggregator
from aleph.index.util import BULK_PAGE

log = logging.getLogger(__name__)


def process_collection(collection, ingest=True):
    """Trigger a full re-parse of all documents and re-build the
    search index from the aggregator."""
    aggregator = get_aggregator(collection)
    try:
        writer = aggregator.bulk()
        for entity in Entity.by_collection(collection.id).yield_per(1000):
            writer.put(entity.to_proxy(), fragment='db')
        for document in Document.by_collection(collection.id).yield_per(1000):
            proxy = document.to_proxy()
            writer.put(proxy, fragment='db')
            if ingest:
                ingest_entity(collection, proxy)
        writer.flush()
        index_entities(collection, aggregator.iterate())
    finally:
        aggregator.close()


def index_aggregate(collection, unsafe=False):
    """Project the contents of the collections aggregator into the index."""
    aggregator = get_aggregator(collection)
    try:
        index_entities(collection, aggregator.iterate(), unsafe=unsafe)
    finally:
        aggregator.close()


def index_entities(collection, iterable, unsafe=False):
    namespace = Namespace(collection.foreign_id)
    entities = []
    for entity in iterable:
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=entity.to_dict())
        entity = namespace.apply(entity)
        if not unsafe:
            entity = remove_checksums(entity)

        tag_entity(entity)
        entities.append(entity)
        if len(entities) >= BULK_PAGE:
            index.index_bulk(collection, entities)
            entities = []

    if len(entities):
        index.index_bulk(collection, entities)

    refresh_collection(collection)


def bulk_write(collection, iterable, unsafe=False):
    """Write a set of entities - given as dicts - to the index in bulk
    mode. This will perform validation but is dangerous as it means the
    application has no control over key generation and a few other aspects
    of building the entity.
    """
    entities = []
    for item in iterable:
        if not is_mapping(item):
            raise InvalidData("Failed to read input data", errors=item)
        entities.append(model.get_proxy(item))
    index_entities(collection, entities, unsafe=unsafe)
