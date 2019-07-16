import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.pragma import remove_checksums
from followthemoney.namespace import Namespace

from aleph.model import Entity, Document
from aleph.queues import ingest_entity
from aleph.analysis import tag_entity
from aleph.queues import get_queue, queue_task, OP_INDEX
from aleph.index.entities import index_bulk
from aleph.logic.entities import refresh_entity_id
from aleph.logic.collections import refresh_collection, reset_collection
from aleph.logic.aggregator import get_aggregator
from aleph.index.util import BULK_PAGE

log = logging.getLogger(__name__)


def _collection_proxies(collection):
    for entity in Entity.by_collection(collection.id).yield_per(1000):
        yield entity.to_proxy()
    for document in Document.by_collection(collection.id).yield_per(1000):
        yield document.to_proxy()


def process_collection(collection, ingest=True, reset=False, sync=False):
    """Trigger a full re-parse of all documents and re-build the
    search index from the aggregator."""
    ingest = ingest or reset
    if reset:
        reset_collection(collection, sync=True)
    aggregator = get_aggregator(collection)
    try:
        writer = aggregator.bulk()
        for proxy in _collection_proxies(collection):
            writer.put(proxy, fragment='db')
        writer.flush()
        if ingest:
            for proxy in aggregator:
                ingest_entity(collection, proxy)
        else:
            queue_task(collection, OP_INDEX, context={'sync': sync})
    finally:
        aggregator.close()


def index_aggregate(stage, collection, entity_id=None, sync=False):
    """Project the contents of the collections aggregator into the index."""
    aggregator = get_aggregator(collection)
    try:
        entities = aggregator
        if entity_id is not None:
            entities = list(aggregator.iterate(entity_id=entity_id))

            # EXPERIMENT: Instead of indexing a single entity, this will
            # try pull a whole batch of them off the queue and do it at
            # once.
            for (_, payload, _) in stage.get_tasks(limit=50):
                entity_id = payload.get('entity_id')
                entities.extend(aggregator.iterate(entity_id=entity_id))
            # End

            for entity in entities:
                log.debug("Index: %r", entity)
                refresh_entity_id(entity.id)
        else:
            stage.progress.mark_pending(len(entities) - 1)
        index_entities(stage, collection, entities, sync=sync)
    finally:
        aggregator.close()


def index_entities(stage, collection, iterable, sync=False):
    entities = []
    for entity in iterable:
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=entity.to_dict())

        tag_entity(entity)
        entities.append(entity)
        if len(entities) >= BULK_PAGE:
            stage.progress.mark_finished(len(entities))
            index_bulk(collection, entities, job_id=stage.job.id, sync=sync)
            entities = []

    if len(entities):
        stage.progress.mark_finished(len(entities))
        index_bulk(collection, entities, job_id=stage.job.id, sync=sync)
    refresh_collection(collection)


def bulk_write(collection, iterable, job_id=None, unsafe=False):
    """Write a set of entities - given as dicts - to the index in bulk
    mode. This will perform validation but is dangerous as it means the
    application has no control over key generation and a few other aspects
    of building the entity.
    """
    namespace = Namespace(collection.foreign_id)
    stage = get_queue(collection, OP_INDEX, job_id=job_id)
    entities = []
    for item in iterable:
        if not is_mapping(item):
            raise InvalidData("Failed to read input data", errors=item)
        entity = model.get_proxy(item)
        entity = namespace.apply(entity)
        if not unsafe:
            entity = remove_checksums(entity)
        entities.append(entity)
    stage.progress.mark_pending(len(entities))
    index_entities(stage, collection, entities)
