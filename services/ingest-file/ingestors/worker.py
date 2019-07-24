import logging
from followthemoney import model
from servicelayer.worker import Worker
from servicelayer.jobs import JobStage as Stage

from ingestors.manager import Manager

log = logging.getLogger(__name__)


class IngestWorker(Worker):
    """A long running task runner that uses Redis as a task queue"""

    def dispatch_next(self, stage, context, entities):
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

    def handle(self, task):
        manager = Manager(task.stage, task.context)
        entity = model.get_proxy(task.payload)
        log.debug("Ingest: %r", entity)
        manager.ingest_entity(entity)
        manager.close()
        self.dispatch_next(task.stage, task.context, manager.emitted)
