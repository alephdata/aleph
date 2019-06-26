import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.pragma import remove_checksums
from followthemoney.namespace import Namespace

from aleph.model import Entity, Document
from aleph.queues import ingest_entity, ingest_wait
from aleph.queues import get_queue, OP_INDEX
from aleph.analysis import tag_entity
from aleph.index.entities import index_bulk
from aleph.index.collections import index_collection
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
        if ingest:
            ingest_wait(collection)
        else:
            index_entities(collection, aggregator)
    finally:
        aggregator.close()


def index_aggregate(queue, collection, sync=False):
    """Project the contents of the collections aggregator into the index."""
    aggregator = get_aggregator(collection)
    try:
        index_entities(collection, aggregator, sync=sync)
        refresh_collection(collection.id, sync=sync)
        index_collection(collection, sync=sync)
        log.info("Aggregate indexed: %r", collection)
    finally:
        aggregator.close()
        queue.remove()


def index_entities(collection, iterable, sync=False):
    queue = get_queue(collection, OP_INDEX)
    queue.progress.mark_pending(len(iterable))
    entities = []
    for entity in iterable:
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=entity.to_dict())

        tag_entity(entity)
        entities.append(entity)
        if len(entities) >= BULK_PAGE:
            queue.progress.mark_finished(len(entities))
            index_bulk(collection, entities, sync=sync)
            entities = []

    if len(entities):
        queue.progress.mark_finished(len(entities))
        index_bulk(collection, entities, sync=sync)
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
