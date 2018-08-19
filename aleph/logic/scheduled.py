import logging

from aleph.core import celery
from aleph.logic.alerts import check_alerts
from aleph.logic.collections import update_collections
from aleph.logic.notifications import generate_digest

log = logging.getLogger(__name__)


@celery.task(priority=7, expires=3600)
def hourly():
    update_collections()
    check_alerts()


@celery.task(priority=7, expires=84600)
def daily():
    generate_digest()
