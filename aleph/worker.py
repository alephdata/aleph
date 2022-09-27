import structlog
from servicelayer.jobs import Dataset
from servicelayer.worker import Worker
from servicelayer.logs import apply_task_context

from aleph import __version__
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
from aleph.logic.collections import reingest_collection, reindex_collection
from aleph.logic.collections import compute_collections, refresh_collection
from aleph.logic.notifications import generate_digest, delete_old_notifications
from aleph.logic.roles import update_roles
from aleph.logic.export import delete_expired_exports, export_entities
from aleph.logic.processing import index_many
from aleph.logic.xref import xref_collection, export_matches
from aleph.logic.entities import update_entity, prune_entity
from aleph.logic.mapping import load_mapping, flush_mapping

log = structlog.get_logger(__name__)

app = create_app(config={"SERVER_NAME": settings.APP_UI_URL})


def op_index(collection, task):
    sync = task.context.get("sync", False)
    index_many(task.stage, collection, sync=sync, **task.payload)


def op_reingest(collection, task):
    reingest_collection(collection, job_id=task.stage.job.id, **task.payload)


def op_reindex(collection, task):
    sync = task.context.get("sync", False)
    reindex_collection(collection, sync=sync, **task.payload)


def op_flush_mapping(collection, task):
    sync = task.context.get("sync", False)
    flush_mapping(collection, sync=sync, **task.payload)


# All stages that aleph should listen for. Does not include ingest,
# which is received and processed by the ingest-file service.
OPERATIONS = {
    OP_INDEX: op_index,
    OP_XREF: lambda c, _: xref_collection(c),
    OP_REINGEST: op_reingest,
    OP_REINDEX: op_reindex,
    OP_LOAD_MAPPING: lambda c, t: load_mapping(c, **t.payload),
    OP_FLUSH_MAPPING: op_flush_mapping,
    OP_EXPORT_SEARCH: lambda _, t: export_entities(**t.payload),
    OP_EXPORT_XREF: lambda _, t: export_matches(**t.payload),
    OP_UPDATE_ENTITY: lambda c, t: update_entity(c, job_id=t.stage.job.id, **t.payload),
    OP_PRUNE_ENTITY: lambda c, t: prune_entity(c, job_id=t.stage.job.id, **t.payload),
}


class AlephWorker(Worker):
    def boot(self):
        self.often = get_rate_limit("often", unit=300, interval=1, limit=1)
        self.daily = get_rate_limit("daily", unit=3600, interval=24, limit=1)

    def periodic(self):
        with app.app_context():
            db.session.remove()
            if self.often.check():
                self.often.update()
                log.info("Self-check...")
                self.cleanup_jobs()
                compute_collections()

            if self.daily.check():
                self.daily.update()
                log.info("Running daily tasks...")
                update_roles()
                check_alerts()
                generate_digest()
                delete_expired_exports()
                delete_old_notifications()

    def dispatch_task(self, task):
        collection = get_dataset_collection_id(task.job.dataset.name)
        if collection is not None:
            collection = Collection.by_id(collection, deleted=True)
        log.info(f"Task [{task.job.dataset}]: {task.stage.stage} (started)")
        handler = OPERATIONS[task.stage.stage]
        handler(collection, task)
        log.info(f"Task [{task.job.dataset}]: {task.stage.stage} (done)")

    def handle(self, task):
        with app.app_context():
            apply_task_context(task, v=__version__)
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


def get_worker(num_threads=None):
    operations = tuple(OPERATIONS.keys())
    log.info(f"Worker active, stages: {operations}")
    return AlephWorker(conn=kv, stages=operations, num_threads=num_threads)
