import logging
from servicelayer.rate_limit import RateLimit
from servicelayer.jobs import Job, Stage, Dataset

from aleph.core import kv, settings

log = logging.getLogger(__name__)

OP_INGEST = Stage.INGEST
OP_INDEX = 'index'
OP_XREF = 'xref'
OP_XREF_ITEM = 'xitem'
OP_PROCESS = 'process'
OP_REFRESH_MAPPING = 'refreshmapping'
OP_FLUSH_MAPPING = 'flushmapping'

# All stages that aleph should listen for. Does not include ingest,
# which is received and processed by the ingest-file service.
OPERATIONS = (OP_INDEX, OP_XREF, OP_PROCESS, OP_XREF_ITEM, OP_REFRESH_MAPPING, OP_FLUSH_MAPPING)  # noqa


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def get_stage(collection, stage, job_id=None):
    job_id = job_id or Job.random_id()
    job = Job(kv, collection.foreign_id, job_id)
    return job.get_stage(stage)


def queue_task(collection, stage, job_id=None, payload=None, context=None):
    stage = get_stage(collection, stage, job_id=job_id)
    stage.queue(payload or {}, context or {})
    if settings.TESTING:
        from aleph.worker import get_worker
        worker = get_worker()
        worker.sync()


def get_status(collection):
    return Dataset(kv, collection.foreign_id).get_status()


def get_active_collection_status():
    data = Dataset.get_active_dataset_status(kv)
    return data


def cancel_queue(collection):
    Dataset(kv, collection.foreign_id).cancel()


def ingest_entity(collection, proxy, job_id=None, sync=False):
    """Send the given FtM entity proxy to the ingest-file service."""
    log.debug("Ingest entity [%s]: %s", proxy.id, proxy.caption)
    stage = get_stage(collection, OP_INGEST, job_id=job_id)
    from aleph.logic.aggregator import get_aggregator_name
    context = {
        'languages': collection.languages,
        'balkhash_name': get_aggregator_name(collection),
        'next_stage': OP_INDEX,
        'sync': sync
    }
    stage.queue(proxy.to_dict(), context)
