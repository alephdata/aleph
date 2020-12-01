import logging
from servicelayer.jobs import Dataset
from servicelayer.worker import Worker
from servicelayer.extensions import get_entry_point

from aleph.core import kv, db, create_app, settings
from aleph.model import Collection
from aleph.queues import get_rate_limit, get_dataset_collection_id
from aleph.queues import (
    OP_INDEX,
    OP_REINDEX,
    OP_REINGEST,
    OP_XREF,
    OP_EXPORT_SEARCH,
    OP_EXPORT_XREF,
    OP_LOAD_MAPPING,
    OP_FLUSH_MAPPING,
    OP_UPDATE_ENTITY,
    OP_PRUNE_ENTITY,
)
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import compute_collections, refresh_collection
from aleph.logic.notifications import generate_digest
from aleph.logic.roles import update_roles
from aleph.logic.export import delete_expired_exports

log = logging.getLogger(__name__)
app = create_app(config={"SERVER_NAME": settings.APP_UI_URL})

# All stages that aleph should listen for. Does not include ingest,
# which is received and processed by the ingest-file service.
OPERATIONS = (
    OP_INDEX,
    OP_XREF,
    OP_REINGEST,
    OP_REINDEX,
    OP_LOAD_MAPPING,
    OP_FLUSH_MAPPING,
    OP_EXPORT_SEARCH,
    OP_EXPORT_XREF,
    OP_UPDATE_ENTITY,
    OP_PRUNE_ENTITY,
)


class AlephWorker(Worker):
    def boot(self):
        self.often = get_rate_limit("often", unit=300, interval=1, limit=1)
        self.hourly = get_rate_limit("hourly", unit=3600, interval=1, limit=1)
        self.daily = get_rate_limit("daily", unit=3600, interval=24, limit=1)

    def run_often(self):
        log.info("Self-check...")
        self.cleanup_jobs()
        compute_collections()

        if self.hourly.check():
            self.hourly.update()
            log.info("Running hourly tasks...")
            check_alerts()

        if self.daily.check():
            self.daily.update()
            log.info("Running daily tasks...")
            generate_digest()
            update_roles()
            delete_expired_exports()

    def periodic(self):
        with app.app_context():
            db.session.remove()
            if self.often.check():
                self.often.update()
                self.run_often()

    def dispatch_task(self, task):
        collection = get_dataset_collection_id(task.job.dataset.name)
        if collection is not None:
            collection = Collection.by_id(collection, deleted=True)
        handler = get_entry_point("aleph.task_handlers", task.stage.stage)
        if handler is None:
            log.warning(
                "Task handler not found for task [%s]: %s",
                task.job.dataset,
                task.stage.stage,
            )
            return
        handler(collection, task)
        log.info("Task [%s]: %s (done)", task.job.dataset, task.stage.stage)

    def handle(self, task):
        with app.app_context():
            self.dispatch_task(task)

    def cleanup_job(self, job):
        if job.is_done():
            collection = Collection.by_foreign_id(job.dataset.name)
            if collection is not None:
                refresh_collection(collection.id)
            job.remove()

    def cleanup_jobs(self):
        for dataset in Dataset.get_active_datasets(kv):
            for job in dataset.get_jobs():
                self.cleanup_job(job)

    def after_task(self, task):
        with app.app_context():
            self.cleanup_job(task.job)


def get_worker():
    log.info("Worker active, stages: %s", OPERATIONS)
    return AlephWorker(conn=kv, stages=OPERATIONS, num_threads=None)
