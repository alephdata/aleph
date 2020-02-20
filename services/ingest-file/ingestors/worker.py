import logging
from followthemoney import model
from servicelayer.worker import Worker

from ingestors.analysis import Analyzer
from ingestors.manager import Manager
from ingestors.report import clean_report_payload


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
        stage.queue({'entity_ids': entity_ids}, task.context)
        if self.should_report(task):
            reporter = self.get_task_reporter(task)
            for entity_id in entity_ids:
                reporter.end(entity={'id': entity_id})  # mark current as end
                reporter.start(stage=next_stage, entity={'id': entity_id})  # start next task reporting

    def _ingest(self, task):
        reporter = self.get_task_reporter(task) if self.should_report(task) else False
        manager = Manager(task.stage, task.context, reporter=reporter)
        entity = model.get_proxy(task.payload)
        log.debug('Ingest: %r', entity)
        try:
            manager.ingest_entity(entity)
        finally:
            manager.close()
        return manager.emitted

    def _analyze(self, task):
        entity_ids = task.payload.get('entity_ids')
        dataset = Manager.get_dataset(task.stage, task.context)
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
        if task.stage.stage == OP_INGEST:
            entity_ids = self._ingest(task)
            self.dispatch_next(task, entity_ids)
        elif task.stage.stage == OP_ANALYZE:
            entity_ids = self._analyze(task)
            self.dispatch_next(task, entity_ids)
        else:
            log.error('Unknown task: %r', task)

    def get_task_reporter(self, task):
        reporter = super().get_task_reporter(task)
        reporter.clean_payload = clean_report_payload
        return reporter
