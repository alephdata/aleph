import logging

from followthemoney.namespace import Namespace

from servicelayer.jobs import Job, Task
from servicelayer.task_reporting import TaskReporter

from aleph.core import kv
from aleph.index.reports import index_bulk
from aleph.queues import get_active_collections, queue_task, OP_REPORT


log = logging.getLogger(__name__)


def clean_report_payload(payload):
    # sign entity ids
    entity = payload['entity']
    if not isinstance(entity, dict):
        entity = entity.to_dict()
    ns = payload.pop('ns', None)
    if ns is None:
        ns = Namespace(payload['dataset'])
    entity['id'] = ns.sign(entity['id'])
    payload['entity'] = entity
    return payload


def get_reporter(**defaults):
    return TaskReporter(conn=kv, clean_payload=clean_report_payload, **defaults)


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
