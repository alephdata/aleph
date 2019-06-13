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
    def handle_task(cls, queue, payload, context):
        try:
            manager = Manager(queue, context)
            entity = model.get_proxy(payload)
            log.debug("Ingest: %r", entity)
            manager.ingest_entity(entity)
            manager.close()
        except Exception:
            log.exception("Processing failed.")

        queue.task_done()
        if queue.is_done():
            log.info("Ingest %r finished, queue index...", queue.dataset)
            index = ServiceQueue(queue.conn,
                                 ServiceQueue.OP_INDEX,
                                 queue.dataset,
                                 priority=queue.priority)
            index.queue_task({}, {})
            queue.remove()

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
        log.info("Processing queue (%s threads)", settings.INGESTOR_THREADS)
        threads = []
        for _ in range(settings.INGESTOR_THREADS):
            t = threading.Thread(target=cls.process)
            t.daemon = True
            t.start()
            threads.append(t)
        for t in threads:
            t.join()
