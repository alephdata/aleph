import logging

from servicelayer.jobs import Job, Task
from servicelayer.util import dump_json

from aleph.core import kv
from aleph.index.reports import index_bulk
from aleph.queues import get_active_collections, queue_task, OP_REPORT


log = logging.getLogger(__name__)


def index_reports(stage, batch=1000, sync=False):
    tasks = stage.get_tasks(limit=batch)
    if len(tasks):
        log.debug('Indexing %s task reports' % len(tasks))
        index_bulk(tasks, sync=sync)
        stage.mark_done(len(tasks))


def collect_report_tasks(batch=1000, sync=False):
    collections = get_active_collections()
    for collection in collections:
        for job in collection.get_jobs():
            stage = job.get_stage(OP_REPORT)
            index_reports(stage, batch, sync)


def create_report_task(stage, dataset, job, lifecycle='start', extra_data={}, exception=None):
    """queue an index report task about something that is not a `servicelayer.jobs.Task` """
    data = {
        'stage': stage,
        'dataset': dataset,
        'job': job,
        'context': {'report_extra_data': extra_data}
    }
    task = Task.unpack(kv, dump_json(data))
    task.report(lifecycle, exception)


def queue_task_from_report(report, job_id=None):
    job_id = 'reprocess-%s' % (job_id or Job.random_id())
    original_dump = report.get('original_dump')
    if original_dump:
        task = Task.unpack(kv, original_dump)
        queue_task(task.job.dataset.name, task.stage.stage, job_id, payload=task.payload, context=task.context)
    # stage = report['stage']
    # document = report['document']
    # dataset = report['dataset']
    # if stage == OP_INDEX:
    #     queue_task(dataset, stage, job_id)
