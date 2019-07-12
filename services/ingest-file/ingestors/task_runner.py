import logging
import threading
from followthemoney import model
from servicelayer.cache import get_redis
from servicelayer.jobs import JobStage as Stage

from ingestors.manager import Manager
from ingestors import settings

log = logging.getLogger(__name__)


class TaskRunner(object):
    """A long running task runner that uses Redis as a task queue"""

    @classmethod
    def handle_retry(cls, stage, payload, context):
        retries = int(context.get('retries', 0))
        if retries < settings.MAX_RETRIES:
            log.info("Queueing failed task for re-try...")
            context['retries'] = retries + 1
            stage.queue_task(payload, context)

    @classmethod
    def handle_done(cls, stage, context, entities):
        next_stage = context.get('next_stage')
        if next_stage is None:
            return
        next_queue = Stage(stage.conn,
                           next_stage,
                           stage.job.id,
                           stage.dataset,
                           priority=stage.priority)
        log.info("Sending %s entities to: %s", len(entities), next_stage)
        for entity_id in entities:
            next_queue.queue_task({'entity_id': entity_id}, context)

    @classmethod
    def handle_task(cls, stage, payload, context):
        manager = Manager(stage, context)
        try:
            entity = model.get_proxy(payload)
            log.debug("Ingest: %r", entity)
            manager.ingest_entity(entity)
            manager.close()
            cls.handle_done(stage, context, manager.emitted)
        except (KeyboardInterrupt, SystemExit, RuntimeError):
            cls.handle_retry(stage, payload, context)
            raise
        except Exception:
            cls.handle_retry(stage, payload, context)
            log.exception("Processing failed.")
        finally:
            stage.task_done()

    @classmethod
    def process(cls, timeout=5):
        conn = get_redis()
        while True:
            task = Stage.get_stage_task(conn,
                                        Stage.INGEST,
                                        timeout=timeout)
            stage, payload, context = task
            if stage is None:
                continue
            cls.handle_task(stage, payload, context)

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
