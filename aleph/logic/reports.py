import logging

from aleph.index.reports import index_bulk


log = logging.getLogger(__name__)


def index_reports(task, collection, batch=1000, sync=False):
    stage = task.stage
    tasks = [task] + stage.get_tasks(limit=batch)
    if len(tasks):
        log.debug('Indexing %s task reports' % len(tasks))
        index_bulk(tasks, collection, sync=sync)
        stage.mark_done(len(tasks))
