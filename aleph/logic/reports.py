import logging

from servicelayer.jobs import Job, Task
from servicelayer.reporting import TaskReporter

from aleph.core import kv
from aleph.index.reports import index_bulk
from aleph.queues import queue_task


log = logging.getLogger(__name__)


def index_reports(task, collection, batch=1000, sync=False):
    stage = task.stage
    tasks = [task] + stage.get_tasks(limit=batch)
    if len(tasks):
        log.debug('Indexing %s task reports' % len(tasks))
        index_bulk(tasks, collection, sync=sync)
        stage.mark_done(len(tasks))


def queue_task_from_report(report, job_id=None):
    job_id = 'reprocess-%s' % (job_id or Job.random_id())
    original_task = report.get('task')
    if original_task:
        task = Task.unpack(kv, original_task)
        queue_task(task.job.dataset.name, task.stage.stage, job_id, payload=task.payload, context=task.context)
    # stage = report['stage']
    # document = report['document']
    # dataset = report['dataset']
    # if stage == OP_INDEX:
    #     queue_task(dataset, stage, job_id)


def get_reporter(**defaults):
    return TaskReporter(conn=kv, **defaults)
