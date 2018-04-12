import logging

from aleph.core import celery
from aleph.logic.alerts import check_alerts

log = logging.getLogger(__name__)


@celery.task()
def background():
    check_alerts()
