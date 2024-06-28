from pprint import pformat  # noqa
from collections import defaultdict
import time
import threading
import functools
import queue
from typing import List
import copy
from typing import Dict, Callable

import structlog
from servicelayer.taskqueue import Worker, Task, Dataset
from servicelayer import settings as sls

from aleph import __version__
from aleph.core import kv, db, create_app
from aleph.settings import SETTINGS
from aleph.model import Collection
from aleph.queues import get_rate_limit
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

INDEXING_TIMEOUT = (
    SETTINGS.INDEXING_TIMEOUT
)  # run all available indexing jobs in a batch after 10 seconds

log = structlog.get_logger(__name__)


app = create_app(config={"SERVER_NAME": SETTINGS.APP_UI_URL})
indexing_lock = threading.Lock()


def op_index(collection_id: str, batch: List[Task], worker: Worker):
    collection = Collection.by_id(collection_id)

    if not collection:
        return

    sync = any(task.context.get("sync", False) for task in batch)
    index_many(collection, sync=sync, tasks=batch)
    for task in batch:
        # acknowledge batched tasks
        log.info(
            f"Task [collection:{task.collection_id}]: "
            f"op:{task.operation} task_id:{task.task_id} priority: {task.priority} (done)"
        )
        # avoid data race with the main thread by using a copy of the task
        channel = task._channel
        delattr(task, "_channel")
        task = copy.deepcopy(task)
        task.context["skip_ack"] = False
        cb = functools.partial(worker.ack_message, task, channel)
        channel.connection.add_callback_threadsafe(cb)


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
OPERATIONS: Dict[str, Callable] = {
    SETTINGS.STAGE_INDEX: op_index,
    SETTINGS.STAGE_XREF: lambda c, _: xref_collection(c),
    SETTINGS.STAGE_REINGEST: op_reingest,
    SETTINGS.STAGE_REINDEX: op_reindex,
    SETTINGS.STAGE_LOAD_MAPPING: lambda c, t: load_mapping(c, **t.payload),
    SETTINGS.STAGE_FLUSH_MAPPING: op_flush_mapping,
    SETTINGS.STAGE_EXPORT_SEARCH: lambda _, t: export_entities(**t.payload),
    SETTINGS.STAGE_EXPORT_XREF: lambda _, t: export_matches(**t.payload),
    SETTINGS.STAGE_UPDATE_ENTITY: lambda c, t: update_entity(
        c, job_id=t.job_id, **t.payload
    ),
    SETTINGS.STAGE_PRUNE_ENTITY: lambda c, t: prune_entity(
        c, job_id=t.job_id, **t.payload
    ),
}


class AlephWorker(Worker):
    def __init__(
        self,
        queues,
        conn=None,
        num_threads=sls.WORKER_THREADS,
        version=None,
        prefetch_count_mapping=defaultdict(lambda: 1),
    ):
        super().__init__(queues, conn=conn, num_threads=num_threads, version=version)
        self.often = get_rate_limit("often", unit=300, interval=1, limit=1)
        self.daily = get_rate_limit("daily", unit=3600, interval=24, limit=1)
        # special treatment for indexing jobs - indexing jobs need to be batched
        # in batches of 100 (specified by INDEXING_BATCH_SIZE) or we wait for 10
        # seconds (specified by INDEXING_TIMEOUT) before triggering an batched
        # run of all available indexing tasks
        self.indexing_batch_last_updated = defaultdict(lambda: None)
        self.indexing_batches = defaultdict(list)
        self.local_queue = queue.Queue()
        self.prefetch_count_mapping = prefetch_count_mapping

    def on_signal(self, signal, _):
        super().on_signal(signal, _)

    def process(self, blocking=True):
        if blocking:
            with app.app_context():
                self.process_blocking()
        else:
            self.process_nonblocking()

    def periodic(self):
        with app.app_context():
            try:
                db.session.remove()
                if self.often.check():
                    self.often.update()
                    log.info("Self-check...")
                    compute_collections()
                    Dataset.cleanup_dataset_status(kv)

                if self.daily.check():
                    self.daily.update()
                    log.info("Running daily tasks...")
                    update_roles()
                    check_alerts()
                    generate_digest()
                    delete_expired_exports()
                    delete_old_notifications()

                self.run_indexing_batches()
            except Exception:
                log.exception("Error while executing periodic tasks")

    def dispatch_task(self, task: Task) -> Task:
        log.info(
            f"Task [collection:{task.collection_id}]: "
            f"op:{task.operation} task_id:{task.task_id} priority: {task.priority} (started)"
        )
        handler = OPERATIONS[task.operation]
        collection = None
        if task.collection_id is not None:
            collection = Collection.by_id(task.collection_id, deleted=True)

        # Task batching for index operation
        if task.operation == SETTINGS.STAGE_INDEX:
            with indexing_lock:
                batch = self.indexing_batches[task.collection_id]
                batch.append(task)
                self.indexing_batch_last_updated[task.collection_id] = time.time()
                if len(batch) >= SETTINGS.INDEXING_BATCH_SIZE:
                    # batch size limit reached; execute the existing batch and reset
                    op_index(task.collection_id, batch, worker=self)
                    del self.indexing_batches[task.collection_id]
                    del self.indexing_batch_last_updated[task.collection_id]
                else:
                    log.info(
                        f"Task [collection:{task.collection_id}]: "
                        f"op:{task.operation} task_id:{task.task_id} priority: {task.priority} (batched)"
                    )
                # skip acknowledgment for batched task; the batch processing function
                # will acknowledge tasks after execution is complete
                task.context["skip_ack"] = True
                return task

        handler(collection, task)
        log.info(
            f"Task [collection:{task.collection_id}]: "
            f"op:{task.operation} task_id:{task.task_id} priority: {task.priority} (done)"
        )
        return task

    def after_task(self, task):
        if not SETTINGS.TESTING:
            if task.collection_id and task.get_dataset(conn=kv).is_done():
                refresh_collection(task.collection_id)

    def run_indexing_batches(self):
        """Run remaining batched indexing tasks after waiting for a maximum of
        INDEXING_TIMEOUT seconds"""
        if indexing_lock.acquire(False):
            batches = list(self.indexing_batches.items())
            indexing_lock.release()
            for collection_id, batch in batches:
                now = time.time()
                since_last_update = int(
                    now - self.indexing_batch_last_updated[collection_id]
                )
                if since_last_update > INDEXING_TIMEOUT:
                    log.debug(
                        f"Running batch indexing for collection {collection_id} ({len(batch)} items)"
                    )
                    op_index(collection_id, batch, worker=self)
                    del self.indexing_batch_last_updated[collection_id]
                    del self.indexing_batches[collection_id]


def get_worker(num_threads=1):
    # The stages performed by AlephWorker correspond to
    # RabbitMQ queues. Both use the same string as a name,
    # By default, AlephWorker implements all stages
    # (and reads from all queues) except "index" and "analyze".
    aleph_worker_stages = list(SETTINGS.ALEPH_STAGES)

    log.info(f"Worker active, stages: {aleph_worker_stages}")

    qos_mapping = {}
    for stage in aleph_worker_stages:
        if stage not in qos_mapping:
            qos_mapping[stage] = SETTINGS.QOS_MAPPING.get(stage, 1)

    return AlephWorker(
        queues=aleph_worker_stages,
        conn=kv,
        num_threads=num_threads or 1,
        version=__version__,
        prefetch_count_mapping=qos_mapping,
    )
