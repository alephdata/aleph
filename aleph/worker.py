import logging

from servicelayer.reporting import Reporter
from servicelayer.worker import Worker

from aleph.core import kv, db
from aleph.model import Collection
from aleph.queues import get_rate_limit
from aleph.queues import (
    OP_INDEX, OP_PROCESS, OP_XREF, OP_XREF_ITEM,
    OP_LOAD_MAPPING, OP_FLUSH_MAPPING, OP_REPORT
)
from aleph.queues import OPERATIONS
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import index_collections, refresh_collection
from aleph.logic.collections import reset_collection, process_collection
from aleph.logic.notifications import generate_digest
from aleph.logic.mapping import load_mapping, flush_mapping
from aleph.logic.reports import index_reports
from aleph.logic.roles import update_roles
from aleph.logic.xref import xref_collection, xref_item
from aleph.logic.processing import index_aggregate

log = logging.getLogger(__name__)


class AlephWorker(Worker):
    def boot(self):
        self.hourly = get_rate_limit('hourly', unit=3600, interval=1, limit=1)
        self.daily = get_rate_limit('daily', unit=3600, interval=24, limit=1)
        self.frequent = get_rate_limit('frequent', unit=300, interval=1, limit=1)

    def periodic(self):
        db.session.remove()
        if self.hourly.check():
            self.hourly.update()
            log.info("Running hourly tasks...")
            index_collections()
            check_alerts()

        if self.daily.check():
            self.daily.update()
            log.info("Running daily tasks...")
            generate_digest()
            update_roles()

    def handle(self, task):
        stage = task.stage
        payload = task.payload
        collection = Collection.by_foreign_id(task.job.dataset.name)
        if collection is None:
            log.error("Collection not found: %s", task.job.dataset)
            return
        sync = task.context.get('sync', False)

        if stage.stage == OP_INDEX:
            reporter = Reporter(task=task)
            index_aggregate(stage, collection, sync=sync, reporter=reporter, **payload)
        if stage.stage == OP_LOAD_MAPPING:
            load_mapping(stage, collection, **payload)
        if stage.stage == OP_FLUSH_MAPPING:
            flush_mapping(stage, collection, sync=sync, **payload)
        if stage.stage == OP_PROCESS:
            if payload.pop('reset', False):
                reset_collection(collection, sync=True, delete_reports=False)
            process_collection(stage, collection, sync=sync, **payload)
        if stage.stage == OP_XREF:
            xref_collection(stage, collection)
        if stage.stage == OP_XREF_ITEM:
            xref_item(stage, collection, **payload)
        if stage.stage == OP_REPORT:
            index_reports(task, collection, sync=sync)
        log.info("Task [%s]: %s (done)", task.job.dataset, stage.stage)

    def after_task(self, task):
        if task.job.is_done():
            collection = Collection.by_foreign_id(task.job.dataset.name)
            if collection is not None:
                refresh_collection(collection.id)
            task.job.remove()


def get_worker():
    log.info("Worker active, stages: %s", OPERATIONS)
    return AlephWorker(conn=kv, stages=OPERATIONS, num_threads=None)
