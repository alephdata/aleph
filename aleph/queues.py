# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT


import logging

from servicelayer.rate_limit import RateLimit
from servicelayer.jobs import Job, Dataset, Stage

from aleph.core import kv, settings
from aleph.model import Entity

log = logging.getLogger(__name__)

OP_INGEST = "ingest"
OP_ANALYZE = "analyze"
OP_INDEX = "index"
OP_XREF = "xref"
OP_REINGEST = "reingest"
OP_REINDEX = "reindex"
OP_LOAD_MAPPING = "loadmapping"
OP_FLUSH_MAPPING = "flushmapping"
OP_EXPORT_SEARCH = "exportsearch"
OP_EXPORT_XREF = "exportxref"
OP_UPDATE_ENTITY = "updateentity"
OP_PRUNE_ENTITY = "pruneentity"

NO_COLLECTION = "null"


def dataset_from_collection(collection):
    """servicelayer dataset from a collection"""
    if collection is None:
        return NO_COLLECTION
    return str(collection.id)


def get_dataset_collection_id(dataset):
    """Invert the servicelayer dataset into a collection ID"""
    if dataset == NO_COLLECTION:
        return None
    return int(dataset)


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def get_stage(collection, stage, job_id=None):
    dataset = dataset_from_collection(collection)
    job_id = job_id or Job.random_id()
    job = Job(kv, dataset, job_id)
    return job.get_stage(stage)


def queue_task(dataset, stage, job_id=None, context=None, **payload):
    stage = get_stage(dataset, stage, job_id=job_id)
    stage.queue(payload or {}, context or {})
    if settings.TESTING:
        from aleph.worker import get_worker

        worker = get_worker()
        while True:
            stages = worker.get_stages()
            task = Stage.get_task(worker.conn, stages, timeout=None)
            if task is None:
                break
            worker.dispatch_task(task)


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
    stage = get_stage(collection, OP_INGEST, job_id=job_id)
    pipeline = list(settings.INGEST_PIPELINE)
    if index:
        pipeline.append(OP_INDEX)
    context = get_context(collection, pipeline)
    stage.queue(proxy.to_dict(), context)


def pipeline_entity(collection, proxy, job_id=None):
    """Send an entity through the ingestion pipeline, minus the ingestor itself."""
    log.debug("Pipeline entity [%s]: %s", proxy.id, proxy.caption)
    pipeline = []
    if not settings.TESTING:
        if proxy.schema.is_a(Entity.ANALYZABLE):
            pipeline.extend(settings.INGEST_PIPELINE)
    pipeline.append(OP_INDEX)
    stage = get_stage(collection, pipeline.pop(0), job_id=job_id)
    context = get_context(collection, pipeline)
    stage.queue({"entity_ids": [proxy.id]}, context)
