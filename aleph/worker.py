from multiprocessing import connection
import structlog
from dataclasses import dataclass
import uuid
import json
from typing import Optional
import time
import threading
import signal
import sys

import pika
from structlog.contextvars import clear_contextvars, bind_contextvars

from aleph import __version__
from aleph.core import kv, db, create_app, settings
from aleph.model import Collection
from aleph.queues import get_rate_limit
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
    index_many(task.operation, collection, sync=sync, **task.payload)


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
    OP_UPDATE_ENTITY: lambda c, t: update_entity(c, job_id=t.stage.job.id, **t.payload),
    OP_PRUNE_ENTITY: lambda c, t: prune_entity(c, job_id=t.stage.job.id, **t.payload),
}


def is_collection_done(collection):
    # ToDo: Fix this
    return True


@dataclass
class Task:
    task_id: str
    job_id: str
    delivery_tag: str
    operation: str
    context: dict
    payload: dict
    collection: Optional[Collection] = None


def get_task(body, delivery_tag) -> Task:
    body = json.loads(body)
    collection = None
    if body["collection_id"] is not None:
        collection = Collection.by_id(body["collection_id"], deleted=True)
    return Task(
        collection=collection,
        task_id=uuid.uuid4().hex,
        job_id=body["job_id"],
        delivery_tag=delivery_tag,
        operation=body["operation"],
        context=body["context"] or {},
        payload=body["payload"] or {},
    )


def apply_task_context(task: Task, **kwargs):
    """This clears the current structured logging context and readies it
    for a new task"""
    # Setup context for structured logging
    clear_contextvars()
    bind_contextvars(
        job_id=task.job_id,
        stage=task.operation,
        dataset=task.collection.foreign_id,
        start_time=time.time(),
        trace_id=str(uuid.uuid4()),
        **kwargs,
    )


class AlephWorker:
    def __init__(self, conn=None, num_threads=settings.WORKER_THREADS):
        self.conn = conn or kv
        self.num_threads = num_threads
        self.often = get_rate_limit("often", unit=300, interval=1, limit=1)
        self.daily = get_rate_limit("daily", unit=3600, interval=24, limit=1)

    def on_signal(self, signal, frame):
        log.warning(f"Shutting down worker (signal {signal})")
        # Exit eagerly without waiting for current task to finish running
        sys.exit(int(signal))

    def connect(self):
        # Pika connections should not be shared between threads. So we use a
        # threadlocal connection object
        self.threadlocal = threading.local()
        self.threadlocal._connection = None
        self.threadlocal._channel = None
        self.threadlocal.messages = []
        self.threadlocal.timer = None
        log.info(f"Connecting to {settings.RABBITMQ_URL}")
        self.threadlocal._connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=settings.RABBITMQ_URL)
        )
        self.threadlocal._channel = self.threadlocal._connection.channel()

    def on_message(self, _, method, properties, body):
        log.info(
            f"Received message # {method.delivery_tag} from {properties.app_id}: {body}"
        )
        task = get_task(body, method.delivery_tag)
        self.handle(task)
        # ToDo: periodic task execution should be independent
        self.periodic()

    def process(self, blocking=True, interval=None):
        if blocking:
            # Recover from connection errors: https://github.com/pika/pika#connection-recovery
            while True:
                try:
                    self.connect()
                    self.threadlocal._channel.queue_declare(
                        queue="task_queue", durable=True
                    )
                    self.threadlocal._channel.basic_qos(prefetch_count=1)
                    self.threadlocal._channel.basic_consume(
                        queue="task_queue", on_message_callback=self.on_message
                    )
                    self.threadlocal._channel.start_consuming()
                # Don't recover if connection was closed by broker
                except pika.exceptions.ConnectionClosedByBroker:
                    break
                # Don't recover on channel errors
                except pika.exceptions.AMQPChannelError:
                    break
                # Recover on all other connection errors
                except pika.exceptions.AMQPConnectionError:
                    continue
        else:
            # non-blocking worker is used for tests. We can go easy on connection recovery
            self.connect()
            self.threadlocal._channel.queue_declare(queue="task_queue", durable=True)
            self.threadlocal._channel.basic_qos(prefetch_count=1)
            while True:
                method, properties, body = self.threadlocal._channel.basic_get(
                    queue="task_queue"
                )
                if method == None:
                    return
                self.on_message(None, method, properties, body)

    def periodic(self):
        with app.app_context():
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

    def dispatch_task(self, task):
        log.info(f"Task [{task.collection}]: {task.operation} (started)")
        handler = OPERATIONS[task.operation]
        handler(task.collection, task)
        log.info(f"Task [{task.collection}]: {task.operation} (done)")

    def handle(self, task):
        # ToDo: handle retries
        try:
            with app.app_context():
                apply_task_context(task, v=__version__)
                self.dispatch_task(task)
        except Exception as e:
            log.exception("Error in task handling")
        finally:
            self.after_task(task)

    def after_task(self, task):
        log.info(f"Acknowledging message {task.delivery_tag}")
        self.threadlocal._channel.basic_ack(task.delivery_tag)
        with app.app_context():
            if is_collection_done(task.collection):
                refresh_collection(task.collection.id)

    def run(self, blocking=True, interval=None):
        signal.signal(signal.SIGINT, self.on_signal)
        signal.signal(signal.SIGTERM, self.on_signal)
        process = lambda: self.process(blocking=blocking, interval=interval)
        if not self.num_threads:
            return process()
        log.info("Worker has %d threads.", self.num_threads)
        threads = []
        for _ in range(self.num_threads):
            thread = threading.Thread(target=process)
            thread.daemon = True
            thread.start()
            threads.append(thread)
        for thread in threads:
            thread.join()


def get_worker(num_threads=None):
    operations = tuple(OPERATIONS.keys())
    log.info(f"Worker active, stages: {operations}")
    return AlephWorker(conn=kv, num_threads=num_threads)
