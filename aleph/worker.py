import logging

from aleph.core import settings
from aleph.model import Collection
from aleph.queue import get_next_task, get_rate_limit
from aleph.queue import OP_INDEX, OP_BULKLOAD
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import index_collections
from aleph.logic.notifications import generate_digest
from aleph.logic.bulkload import bulk_load

log = logging.getLogger(__name__)


def expect_task():
    queue, payload, context = get_next_task()
    if queue is None:
        return
    try:
        collection = Collection.by_foreign_id(queue.dataset)
        if queue.operation == OP_INDEX:
            pass
        if queue.operation == OP_BULKLOAD:
            bulk_load(queue, collection, payload)
    finally:
        queue.task_done()


def queue_worker():
    hourly = get_rate_limit('hourly', unit=3600, interval=1, limit=1)
    daily = get_rate_limit('daily', unit=3600, interval=24, limit=1)
    log.info("Listening for incoming tasks...")
    while True:
        if not hourly.check():
            index_collections()
            hourly.update()
        if not daily.check():
            check_alerts()
            generate_digest()
            daily.update()
        expect_task()


def sync_worker():
    if settings.EAGER:
        queue_worker()
