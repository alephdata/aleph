import logging
from servicelayer.worker import Worker

from aleph.core import kv, db
from aleph.model import Collection
from aleph.queues import get_rate_limit
from aleph.queues import OP_INDEX, OP_BULKLOAD, OP_PROCESS
from aleph.queues import OP_XREF, OP_XREF_ITEM
from aleph.queues import OPERATIONS
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import index_collections
from aleph.logic.notifications import generate_digest
from aleph.logic.bulkload import bulk_load
from aleph.logic.xref import xref_collection, xref_item
from aleph.logic.processing import index_aggregate, process_collection

log = logging.getLogger(__name__)


class AlephWorker(Worker):

    def boot(self):
        self.hourly = get_rate_limit('hourly', unit=3600, interval=1, limit=1)
        self.daily = get_rate_limit('daily', unit=3600, interval=24, limit=1)

    def periodic(self):
        db.session.remove()
        if self.hourly.check():
            self.hourly.update()
            log.info("Running hourly tasks...")
            index_collections()

        if self.daily.check():
            self.daily.update()
            log.info("Running daily tasks...")
            check_alerts()
            generate_digest()

    def handle(self, stage, payload, context):
        collection = Collection.by_foreign_id(stage.dataset)
        if collection is None:
            log.error("Collection not found: %s", stage.dataset)
            return
        sync = context.get('sync', False)
        if stage.stage == OP_INDEX:
            index_aggregate(stage, collection, sync=sync, **payload)
        if stage.stage == OP_BULKLOAD:
            bulk_load(stage, collection, payload)
        if stage.stage == OP_PROCESS:
            process_collection(stage, collection, sync=sync, **payload)
        if stage.stage == OP_XREF:
            xref_collection(stage, collection, **payload)
        if stage.stage == OP_XREF_ITEM:
            xref_item(stage, collection, **payload)
        log.info("Task [%s]: %s (done)", stage.dataset, stage.stage)


def get_worker():
    log.info("Listen: %s, stages: %s", kv, OPERATIONS)
    return AlephWorker(conn=kv, stages=OPERATIONS, num_threads=None)
