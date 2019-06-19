import time
import logging
from servicelayer.process import RateLimit, Progress
from servicelayer.process import ServiceQueue as Queue

from aleph.core import kv, settings
from aleph.model import Document

log = logging.getLogger(__name__)

OP_INGEST = Queue.OP_INGEST
OP_INDEX = Queue.OP_INDEX
OP_XREF = 'xref'
OP_PROCESS = 'process'
OP_BULKLOAD = 'bulkload'

# All operations that aleph should listen for. Does not include ingest,
# which is received and processed by the ingest-file service.
OPERATIONS = (OP_INDEX, OP_XREF, OP_PROCESS, OP_BULKLOAD)


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def get_queue(collection, operation):
    dataset = collection.foreign_id
    priority = Queue.PRIO_MEDIUM if collection.casefile else Queue.PRIO_LOW
    return Queue(kv, operation, dataset, priority=priority)


def queue_task(collection, operation, payload=None, context=None):
    queue = get_queue(collection, operation)
    queue.queue_task(payload or {}, context or {})
    if settings.EAGER:
        from aleph.worker import sync_worker
        sync_worker()


def get_next_task(timeout=5):
    """Get a queue task which aleph is capable of processing."""
    return Queue.get_operation_task(kv, OPERATIONS, timeout=timeout)


def get_status(collection):
    return Progress.get_dataset_status(kv, collection.foreign_id)


def cancel_queue(collection):
    Queue.remove_dataset(kv, collection.foreign_id)


def ingest_wait(collection):
    """Poll redis to see if processing on the collection is complete."""
    if settings.TESTING or not settings.EAGER:
        # Tests run against fakeredis and cannot use the actual ingestor
        # service, so for now we're bailing on the eager behaviour there.
        return
    queue = get_queue(collection, OP_INGEST)
    log.info("Waiting for document ingest...")
    while True:
        if queue.is_done():
            break
        time.sleep(.1)
    from aleph.worker import sync_worker
    sync_worker()


def ingest_entity(collection, proxy):
    """Send the given FtM entity proxy to the ingest-file service."""
    if not proxy.schema.is_a(Document.SCHEMA):
        return
    log.debug("Ingest entity [%s]: %s", proxy.id, proxy.caption)
    queue = get_queue(collection, OP_INGEST)
    from aleph.logic.aggregator import get_aggregator_name
    context = {
        'languages': collection.languages,
        'balkhash_name': get_aggregator_name(collection)
    }
    queue.queue_task(proxy.to_dict(), context)
