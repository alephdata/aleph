import logging
import threading
from followthemoney import model
from servicelayer.cache import get_redis
from servicelayer.process import ServiceQueue

from ingestors.manager import Manager
from ingestors import settings

log = logging.getLogger(__name__)


class TaskRunner(object):
    """A long running task runner that uses Redis as a task queue"""

    @classmethod
    def handle_retry(cls, queue, payload, context):
        retries = int(context.get('retries', 0))
        if retries < settings.MAX_RETRIES:
            log.info("Queueing failed task for re-try...")
            context['retries'] = retries + 1
            queue.queue_task(payload, context)

    @classmethod
    def handle_done(cls, queue):
        if not queue.is_done():
            return
        index = ServiceQueue(queue.conn,
                             ServiceQueue.OP_INDEX,
                             queue.dataset,
                             priority=queue.priority)
        if index.is_done():
            log.info("Ingest %r finished, queue index...", queue.dataset)
            index.queue_task({}, {})
        queue.remove()

    @classmethod
    def handle_task(cls, queue, payload, context):
        queue.task_done()
        try:
            manager = Manager(queue, context)
            entity = model.get_proxy(payload)
            log.debug("Ingest: %r", entity)
            manager.ingest_entity(entity)
            manager.close()
            cls.handle_done(queue)
        except (KeyboardInterrupt, SystemExit, RuntimeError):
            cls.handle_retry(queue, payload, context)
            cls.handle_done(queue)
            raise
        except Exception:
            cls.handle_retry(queue, payload, context)
            cls.handle_done(queue)
            log.exception("Processing failed.")

    @classmethod
    def process(cls, timeout=5):
        conn = get_redis()
        while True:
            task = ServiceQueue.get_operation_task(conn,
                                                   ServiceQueue.OP_INGEST,
                                                   timeout=timeout)
            queue, payload, context = task
            if queue is None:
                continue
            cls.handle_task(queue, payload, context)

    @classmethod
    def run(cls):
        log.info("Processing queue (%s threads)", settings.NUM_THREADS)
        threads = []
        for _ in range(settings.NUM_THREADS):
            t = threading.Thread(target=cls.process)
            t.daemon = True
            t.start()
            threads.append(t)
        for t in threads:
            t.join()
