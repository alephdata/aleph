import logging
from servicelayer.queue import RateLimit, Progress
from servicelayer.queue import ServiceQueue as Queue

from aleph.core import kv

log = logging.getLogger(__name__)

OP_INGEST = Queue.OP_INGEST
OP_INDEX = Queue.OP_INDEX
OP_XREF = 'xref'
OP_XREFITEM = 'xrefitem'
OP_PROCESS = 'process'
OP_BULKLOAD = 'bulkload'

# All operations that aleph should listen for. Does not include ingest,
# which is received and processed by the ingest-file service.
OPERATIONS = (OP_INDEX, OP_XREF, OP_XREFITEM, OP_PROCESS, OP_BULKLOAD)


def get_rate_limit(resource, limit=100, interval=60, unit=1):
    return RateLimit(kv, resource, limit=limit, interval=interval, unit=unit)


def get_queue(collection, operation, priority=Queue.PRIO_LOW):
    dataset = collection.foreign_id
    priority = Queue.PRIO_MEDIUM if collection.casefile else Queue.PRIO_LOW
    return Queue(kv, operation, dataset, priority=priority)


def get_status(collection):
    return Progress.get_dataset_status(kv, collection.foreign_id)


def ingest_entity(collection, proxy):
    queue = get_queue(collection, OP_INGEST)
    context = {'languages': collection.languages}
    queue.queue_task(proxy.to_dict(), context)


def get_next_task(timeout=5):
    return Queue.get_operation_task(kv, OPERATIONS, timeout=timeout)
