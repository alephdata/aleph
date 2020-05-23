import logging
from followthemoney import model
from servicelayer.worker import Worker

from ingestors.store import get_dataset
from ingestors.manager import Manager
from ingestors.analysis import Analyzer

log = logging.getLogger(__name__)
OP_INGEST = 'ingest'
OP_ANALYZE = 'analyze'


class IngestWorker(Worker):
    """A long running task runner that uses Redis as a task queue"""

    def dispatch_next(self, task, entity_ids):
        if not len(entity_ids):
            return
        pipeline = task.context.get('pipeline')
        if pipeline is None or not len(pipeline):
            return
        next_stage = pipeline.pop(0)
        stage = task.job.get_stage(next_stage)
        context = task.context
        context['pipeline'] = pipeline
        log.info('Sending %s entities to: %s', len(entity_ids), next_stage)
        stage.queue({'entity_ids': entity_ids}, context)

    def _ingest(self, dataset, task):
        manager = Manager(dataset, task.stage, task.context)
        entity = model.get_proxy(task.payload)
        log.debug('Ingest: %r', entity)
        try:
            manager.ingest_entity(entity)
        finally:
            manager.close()
        return manager.emitted

    def _analyze(self, dataset, task):
        entity_ids = task.payload.get('entity_ids')
        analyzer = None
        for entity in dataset.partials(entity_id=entity_ids):
            if analyzer is None or analyzer.entity.id != entity.id:
                if analyzer is not None:
                    analyzer.flush()
                # log.debug("Analyze: %r", entity)
                analyzer = Analyzer(dataset, entity)
            analyzer.feed(entity)
        if analyzer is not None:
            analyzer.flush()
        return entity_ids

    def handle(self, task):
        name = task.context.get('ftmstore', task.job.dataset.name)
        dataset = get_dataset(name, task.stage.stage)
        try:
            if task.stage.stage == OP_INGEST:
                entity_ids = self._ingest(dataset, task)
                self.dispatch_next(task, entity_ids)
            elif task.stage.stage == OP_ANALYZE:
                entity_ids = self._analyze(dataset, task)
                self.dispatch_next(task, entity_ids)
        finally:
            dataset.close()
