import logging
from servicelayer.jobs import RateLimit, Progress
from servicelayer.jobs import Job, JobStage as Stage

from aleph.core import kv, settings
from aleph.model import Document
from aleph.index.entities import index_proxy

log = logging.getLogger(__name__)

OP_INGEST = Stage.INGEST
OP_INDEX = 'index'
OP_XREF = 'xref'
OP_PROCESS = 'process'
OP_BULKLOAD = 'bulkload'

# All stages that aleph should listen for. Does not include ingest,
# which is received and processed by the ingest-file service.
OPERATIONS = (OP_INDEX, OP_XREF, OP_PROCESS, OP_BULKLOAD)


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def get_queue(collection, stage, job_id=None, priority=None):
    dataset = collection.foreign_id
    if priority is None:
        priority = Stage.PRIO_MEDIUM if collection.casefile else Stage.PRIO_LOW
    job_id = job_id or Job.random_id()
    return Stage(kv, stage, job_id, dataset, priority=priority)


def queue_task(collection, stage, job_id=None, payload=None, context=None):
    queue = get_queue(collection, stage, job_id=job_id)
    queue.queue_task(payload or {}, context or {})
    if settings.EAGER:
        from aleph.worker import sync_worker
        sync_worker()


def get_next_task(timeout=5):
    """Get a queue task which aleph is capable of processing."""
    return Stage.get_stage_task(kv, OPERATIONS, timeout=timeout)


def get_status(collection):
    return Progress.get_dataset_status(kv, collection.foreign_id)


def cancel_queue(collection):
    Job.remove_dataset(kv, collection.foreign_id)


def ingest_entity(collection, proxy, job_id=None, sync=False):
    """Send the given FtM entity proxy to the ingest-file service."""
    if proxy.schema.is_a(Document.SCHEMA_FOLDER):
        index_proxy(collection, proxy, sync=sync)
    priority = Stage.PRIO_HIGH if sync else None
    log.debug("Ingest entity [%s]: %s", proxy.id, proxy.caption)
    queue = get_queue(collection, OP_INGEST, job_id=job_id, priority=priority)
    from aleph.logic.aggregator import get_aggregator_name
    context = {
        'languages': collection.languages,
        'balkhash_name': get_aggregator_name(collection),
        'next_stage': OP_INDEX,
        'sync': sync
    }
    queue.queue_task(proxy.to_dict(), context)
