import logging
import threading

from servicelayer import taskqueue
from servicelayer.rate_limit import RateLimit
from servicelayer.taskqueue import (
    Dataset,
    dataset_from_collection,
)

from aleph.core import kv, rabbitmq_conn
from aleph.settings import SETTINGS
from aleph.model import Entity

log = logging.getLogger(__name__)


lock = threading.Lock()


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def queue_task(collection, stage, job_id=None, context=None, **payload):
    taskqueue.queue_task(
        rabbitmq_conn,
        kv,
        collection.id,
        stage,
        job_id=job_id,
        context=context,
        **payload
    )
    if SETTINGS.TESTING and lock.acquire(False):
        from aleph.worker import get_worker

        worker = get_worker()
        worker.process(blocking=False)
        lock.release()


def get_status(collection):
    dataset = dataset_from_collection(collection)
    return Dataset(kv, dataset).get_status()


def get_active_dataset_status():
    data = Dataset.get_active_dataset_status(kv)
    return data


def get_context(collection, pipeline):
    """Set some task context variables that configure the ingestors."""
    from aleph.logic.aggregator import get_aggregator_name

    return {
        "languages": collection.languages,
        "ftmstore": get_aggregator_name(collection),
        "namespace": collection.foreign_id,
        "pipeline": pipeline,
    }


def cancel_queue(collection):
    dataset = dataset_from_collection(collection)
    Dataset(kv, dataset).cancel()


def ingest_entity(collection, proxy, job_id=None, index=True):
    """Send the given entity proxy to the ingest-file service."""

    log.debug("Ingest entity [%s]: %s", proxy.id, proxy.caption)
    pipeline = list(SETTINGS.INGEST_PIPELINE)
    if index:
        pipeline.append(SETTINGS.STAGE_INDEX)
    context = get_context(collection, pipeline)

    queue_task(collection, SETTINGS.STAGE_INGEST, job_id, context, **proxy.to_dict())


def pipeline_entity(collection, proxy, job_id=None):
    """Send an entity through the ingestion pipeline, minus the ingestor itself."""
    log.debug("Pipeline entity [%s]: %s", proxy.id, proxy.caption)
    pipeline = []
    if not SETTINGS.TESTING:
        if proxy.schema.is_a(Entity.ANALYZABLE):
            pipeline.extend(SETTINGS.INGEST_PIPELINE)
    pipeline.append(SETTINGS.STAGE_INDEX)
    context = get_context(collection, pipeline)

    operation = pipeline.pop(0)
    payload = {"entity_ids": [proxy.id]}

    queue_task(collection, operation, job_id, context, **payload)
