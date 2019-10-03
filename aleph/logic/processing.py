import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.pragma import remove_checksums

from aleph.model import Entity, Document
from aleph.queues import ingest_entity
from aleph.analysis import tag_entity
from aleph.queues import queue_task, OP_INDEX
from aleph.index.entities import index_bulk
from aleph.logic.entities import refresh_entity_id
from aleph.logic.collections import refresh_collection, reset_collection
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)


def _collection_proxies(collection):
    for entity in Entity.by_collection(collection.id).yield_per(1000):
        yield entity.to_proxy()
    for document in Document.by_collection(collection.id).yield_per(1000):
        yield document.to_proxy()


def process_collection(stage, collection, ingest=True,
                       reset=False, sync=False):
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
            stage.report_finished(1)
        writer.flush()
        if ingest:
            for proxy in aggregator:
                ingest_entity(collection, proxy, job_id=stage.job.id)
        else:
            queue_task(collection, OP_INDEX,
                       job_id=stage.job.id,
                       context={'sync': sync})
    finally:
        aggregator.close()


def _process_entity(entity, sync=False, proof_id=None):
    """Perform pre-index processing on an entity, includes running the
    NLP pipeline, adding proof if any."""
    if entity.id is None:
        raise InvalidData("No ID for entity", errors=entity.to_dict())
    tag_entity(entity)
    if sync:
        refresh_entity_id(entity.id)
    # log.debug("Index: %r", entity)
    return entity


def _fetch_entities(stage, collection, entity_id=None, batch=50):
    aggregator = get_aggregator(collection)
    try:
        if entity_id is None:
            yield from aggregator
            return
        yield from aggregator.iterate(entity_id=entity_id)

        # WEIRD: Instead of indexing a single entity, this will try
        # pull a whole batch of them off the queue and do it at once.
        done = 0
        for task in stage.get_tasks(limit=batch):
            entity_id = task.payload.get('entity_id')
            for entity in aggregator.iterate(entity_id=entity_id):
                yield entity
                done += 1
        stage.mark_done(done)
    finally:
        aggregator.close()


def index_aggregate(stage, collection, sync=False, **kwargs):
    """Project the contents of the collections aggregator into the index."""
    entity_id = kwargs.get('entity_id')
    mapping_id = kwargs.get('mapping_id')
    proof_id = kwargs.get('proof_id')
    entities = _fetch_entities(stage, collection, entity_id=entity_id)
    entities = (_process_entity(e, sync=sync) for e in entities)
    index_bulk(
        collection, entities, job_id=stage.job.id, mapping_id=mapping_id,
        proof_id=proof_id
    )
    refresh_collection(collection.id)


def bulk_write(collection, entities, job_id=None, unsafe=False):
    """Write a set of entities - given as dicts - to the index."""
    def _generate():
        for data in entities:
            if not is_mapping(data):
                raise InvalidData("Failed to read input data", errors=data)
            entity = model.get_proxy(data)
            if not unsafe:
                entity = remove_checksums(entity)
            yield _process_entity(entity)

    index_bulk(collection, _generate(), job_id=job_id)
    refresh_collection(collection.id)
