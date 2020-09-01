import logging

from servicelayer.rate_limit import RateLimit
from servicelayer.jobs import Job, Dataset
from servicelayer.cache import make_key

from aleph.core import kv, settings
from aleph.model import Collection
from aleph.authz import Authz

log = logging.getLogger(__name__)

OP_INGEST = "ingest"
OP_ANALYZE = "analyze"
OP_INDEX = "index"
OP_XREF = "xref"
OP_REINGEST = "reingest"
OP_REINDEX = "reindex"
OP_LOAD_MAPPING = "loadmapping"
OP_FLUSH_MAPPING = "flushmapping"
OP_EXPORT_SEARCH_RESULTS = "exportsearch"
OP_EXPORT_XREF_RESULTS = "exportxref"

ROLE_PREFIX = "role_id"
COLLECTION_PREFIX = "collection"


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def get_stage(dataset, stage, job_id=None):
    if isinstance(dataset, Collection):
        dataset = sla_dataset_from_collection(dataset)
    elif isinstance(dataset, Authz):
        dataset = sla_dataset_from_role(dataset.id)
    job_id = job_id or Job.random_id()
    job = Job(kv, dataset, job_id)
    return job.get_stage(stage)


def queue_task(dataset, stage, job_id=None, payload=None, context=None):
    stage = get_stage(dataset, stage, job_id=job_id)
    stage.queue(payload or {}, context or {})
    if settings.TESTING:
        from aleph.worker import get_worker

        worker = get_worker()
        worker.sync()


def get_status(collection):
    dataset = sla_dataset_from_collection(collection)
    return Dataset(kv, dataset).get_status()


def get_active_dataset_status():
    data = Dataset.get_active_dataset_status(kv)
    return data


def cancel_queue(collection):
    dataset = sla_dataset_from_collection(collection)
    Dataset(kv, dataset).cancel()


def ingest_entity(collection, proxy, job_id=None, index=True):
    """Send the given FtM entity proxy to the ingest-file service."""
    from aleph.logic.aggregator import get_aggregator_name

    log.debug("Ingest entity [%s]: %s", proxy.id, proxy.caption)
    stage = get_stage(collection, OP_INGEST, job_id=job_id)
    pipeline = list(settings.INGEST_PIPELINE)
    if index:
        pipeline.append(OP_INDEX)
    context = {
        "languages": collection.languages,
        "ftmstore": get_aggregator_name(collection),
        "namespace": collection.foreign_id,
        "pipeline": pipeline,
    }
    stage.queue(proxy.to_dict(), context)


def sla_dataset_from_role(role_id):
    """servicelayer dataset from role_id"""
    return make_key(ROLE_PREFIX, role_id)


def sla_dataset_from_collection(collection):
    """servicelayer dataset from a collection"""
    return make_key(COLLECTION_PREFIX, collection.foreign_id)
