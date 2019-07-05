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
    def handle_done(cls, queue, context, entities):
        next_operation = context.get('next_operation')
        if next_operation is None:
            return
        next_queue = ServiceQueue(queue.conn,
                                  next_operation,
                                  queue.dataset,
                                  priority=queue.priority)
        log.info("Sending %s entities to: %s", len(entities), next_operation)
        for entity_id in entities:
            next_queue.queue_task({'entity_id': entity_id}, context)

    @classmethod
    def handle_task(cls, queue, payload, context):
        manager = Manager(queue, context)
        try:
            entity = model.get_proxy(payload)
            log.debug("Ingest: %r", entity)
            manager.ingest_entity(entity)
            manager.close()
            cls.handle_done(queue, context, manager.emitted)
        except (KeyboardInterrupt, SystemExit, RuntimeError):
            cls.handle_retry(queue, payload, context)
            raise
        except Exception:
            cls.handle_retry(queue, payload, context)
            log.exception("Processing failed.")
        finally:
            queue.task_done()
            if queue.is_done():
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
        log.info("Processing queue (%s threads)", settings.NUM_THREADS)
        threads = []
        for _ in range(settings.NUM_THREADS):
            thread = threading.Thread(target=cls.process)
            thread.daemon = True
            thread.start()
            threads.append(thread)
        for thread in threads:
            thread.join()
