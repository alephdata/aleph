import structlog
from pprint import pformat  # noqa
from collections import defaultdict
import time

from servicelayer.taskqueue import Worker, Task
from servicelayer import settings as sls

from aleph import __version__
from aleph.core import kv, db, create_app, settings
from aleph.model import Collection
from aleph.queues import get_rate_limit, QUEUE_ALEPH, QUEUE_INDEX
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

INDEXING_TIMEOUT = 10  # run all available indexing jobs in a batch after 10 seconds

log = structlog.get_logger(__name__)

app = create_app(config={"SERVER_NAME": settings.APP_UI_URL})


def op_index(collection_id, batch, worker=None):
    collection = Collection.by_id(collection_id)
    if worker is None:
        worker = get_worker()
        worker.connect()
    sync = any(task.context.get("sync", False) for task in batch)
    index_many(collection, sync=sync, tasks=batch)
    for task in batch:
        # acknowledge batched tasks
        log.info(f"Task [{task.collection_id}]: {task.operation} (done)")
        task.context["skip_ack"] = False
        worker.after_task(task)


def op_reingest(collection, task):
    reingest_collection(collection, job_id=task.job_id, **task.payload)


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
    OP_UPDATE_ENTITY: lambda c, t: update_entity(c, job_id=t.job_id, **t.payload),
    OP_PRUNE_ENTITY: lambda c, t: prune_entity(c, job_id=t.job_id, **t.payload),
}


class AlephWorker(Worker):
    def __init__(self, queues, conn=None, num_threads=sls.WORKER_THREADS, version=None):
        super().__init__(queues, conn=conn, num_threads=num_threads, version=version)
        self.often = get_rate_limit("often", unit=300, interval=1, limit=1)
        self.daily = get_rate_limit("daily", unit=3600, interval=24, limit=1)
        # special treatment for indexing jobs - indexing jobs need to be batched in batches
        # of 100 (specified by INDEXING_BATCH_SIZE) or we wait for 10 seconds
        # (specified by INDEXING_TIMEOUT) before triggering an batched run of all available indexing tasks
        self.indexing_batch_last_updated = defaultdict(lambda: None)
        self.indexing_batches = defaultdict(list)

    def on_message(self, _, method, properties, body):
        super().on_message(_, method, properties, body)
        if not settings.TESTING:
            # ToDo: periodic task execution should be independent
            self.periodic()

    def process(self, blocking=True):
        if blocking:
            with app.app_context():
                self.process_blocking()
        else:
            self.process_nonblocking()

    def periodic(self):
        db.session.remove()
        if self.often.check():
            self.often.update()
            log.info("Self-check...")
            compute_collections()

        if self.daily.check():
            self.daily.update()
            log.info("Running daily tasks...")
            update_roles()
            check_alerts()
            generate_digest()
            delete_expired_exports()
            delete_old_notifications()

        self.run_indexing_batches()

    def dispatch_task(self, task: Task) -> Task:
        log.info(f"Task [{task.collection_id}]: {task.operation} (started)")
        handler = OPERATIONS[task.operation]
        collection = None
        if task.collection_id is not None:
            collection = Collection.by_id(task.collection_id, deleted=True)

        # Task batching for index operation
        if task.operation == OP_INDEX:
            batch = self.indexing_batches[task.collection_id]
            batch.append(task)
            self.indexing_batch_last_updated[task.collection_id] = time.time()
            if len(batch) >= settings.INDEXING_BATCH_SIZE:
                # batch size limit reached; execute the existing batch and reset
                op_index(task.collection_id, batch, worker=self)
                del self.indexing_batches[task.collection_id]
                del self.indexing_batch_last_updated[task.collection_id]
            else:
                log.info(f"Task [{task.collection_id}]: {task.operation} (batched)")
            # skip acknowledgement for batched task; the batch processing function
            # will acknowledge tasks after execution is complete
            task.context["skip_ack"] = True
            return task

        handler(collection, task)
        log.info(f"Task [{task.collection_id}]: {task.operation} (done)")
        return task

    def after_task(self, task):
        super().after_task(task)
        if not settings.TESTING:
            if task.collection_id and task.get_dataset().is_done():
                refresh_collection(task.collection_id)

    def run_indexing_batches(self):
        for collection_id, batch in self.indexing_batches.items():
            now = time.time()
            if (
                int(now - self.indexing_batch_last_updated[collection_id])
                > INDEXING_TIMEOUT
            ):
                op_index(collection_id, batch, worker=self)
                del self.indexing_batch_last_updated[collection_id]
                del self.indexing_batches[collection_id]


def get_worker(num_threads=None):
    operations = tuple(OPERATIONS.keys())
    log.info(f"Worker active, stages: {operations}")
    return AlephWorker(
        queues=[QUEUE_ALEPH, QUEUE_INDEX],
        conn=kv,
        num_threads=num_threads,
        version=__version__,
    )
