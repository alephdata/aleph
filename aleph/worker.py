import signal
import logging

from aleph.core import kv, db, settings
from aleph.model import Collection
from aleph.queues import get_next_task, get_rate_limit
from aleph.queues import OP_INDEX, OP_BULKLOAD, OP_PROCESS, OP_XREF
from aleph.index.collections import index_collection
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import index_collections
from aleph.logic.notifications import generate_digest
from aleph.logic.bulkload import bulk_load
from aleph.logic.xref import xref_collection
from aleph.logic.processing import index_aggregate, process_collection

log = logging.getLogger(__name__)


def soft_shutdown(sig, frame):
    log.warning("Shutting down aleph worker.")
    settings._worker_shutdown = True
    raise SystemExit()


def hourly_tasks():
    log.info("Running hourly tasks...")
    index_collections()


def daily_tasks():
    log.info("Running daily tasks...")
    check_alerts()
    generate_digest()


def handle_task(queue, payload, context):
    collection = Collection.by_foreign_id(queue.dataset)
    if collection is None:
        log.error("Collection not found: %s", queue.dataset)
        return
    sync = context.get('sync', False)
    try:
        if queue.operation == OP_INDEX:
            index_aggregate(queue, collection, sync=sync, **payload)
        if queue.operation == OP_BULKLOAD:
            bulk_load(queue, collection, payload)
        if queue.operation == OP_PROCESS:
            process_collection(collection, sync=sync, **payload)
        if queue.operation == OP_XREF:
            xref_collection(queue, collection, **payload)
        log.info("Task [%s]: %s (done)", queue.dataset, queue.operation)
    except (SystemExit, KeyboardInterrupt, Exception):
        retries = int(context.get('retries', 0))
        if retries < settings.QUEUE_RETRY:
            log.info("Queueing failed task for re-try...")
            context['retries'] = retries + 1
            queue.queue_task(payload, context)
        raise
    finally:
        queue.task_done()
        if queue.is_done():
            queue.remove()
            index_collection(collection, sync=sync)


def queue_worker(timeout=5):
    """The main event loop for the Aleph backend."""
    settings._worker_shutdown = False
    signal.signal(signal.SIGINT, soft_shutdown)
    signal.signal(signal.SIGTERM, soft_shutdown)
    hourly = get_rate_limit('hourly', unit=3600, interval=1, limit=1)
    daily = get_rate_limit('daily', unit=3600, interval=24, limit=1)
    log.info("Worker: %s", kv)
    while True:
        if hourly.check():
            hourly.update()
            hourly_tasks()

        if daily.check():
            daily.update()
            daily_tasks()

        queue, payload, context = get_next_task(timeout=timeout)
        if queue is None:
            continue
        handle_task(queue, payload, context)
        db.session.remove()
        if settings._worker_shutdown:
            return


def sync_worker():
    # log.debug("Processing queue events...")
    while True:
        queue, payload, context = get_next_task(timeout=None)
        if queue is None:
            break
        handle_task(queue, payload, context)
