import logging

from aleph.core import celery
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import index_collections

log = logging.getLogger(__name__)


@celery.task(priority=7)
def background():
    index_collections()
    check_alerts()
