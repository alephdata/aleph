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


def _collection_proxies(collection):
    for entity in Entity.by_collection(collection.id).yield_per(1000):
        yield entity.to_proxy()
    for document in Document.by_collection(collection.id).yield_per(1000):
        yield document.to_proxy()


def process_collection(collection, ingest=True):
    """Trigger a full re-parse of all documents and re-build the
    search index from the aggregator."""
    aggregator = get_aggregator(collection)
    try:
        writer = aggregator.bulk()
        for proxy in _collection_proxies(collection):
            writer.put(proxy, fragment='db')
            if ingest:
                ingest_entity(collection, proxy)
        writer.flush()
        if not ingest:
            index_entities(collection, aggregator.iterate())
    finally:
        aggregator.close()


def index_aggregate(collection):
    """Project the contents of the collections aggregator into the index."""
    aggregator = get_aggregator(collection)
    try:
        index_entities(collection, aggregator.iterate())
        log.info("Aggregate indexed: %r", collection)
    finally:
        aggregator.close()


def index_entities(collection, iterable):
    entities = []
    for entity in iterable:
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=entity.to_dict())

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
    namespace = Namespace(collection.foreign_id)
    entities = []
    for item in iterable:
        if not is_mapping(item):
            raise InvalidData("Failed to read input data", errors=item)
        entity = model.get_proxy(item)
        entity = namespace.apply(entity)
        if not unsafe:
            entity = remove_checksums(entity)

        entities.append(entity)
    index_entities(collection, entities)
