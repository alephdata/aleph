import logging
from datetime import timedelta, datetime

from aleph.model import CrawlerState

log = logging.getLogger(__name__)


class CrawlerSchedule(object):

    def __init__(self, name, **delta):
        self.name = name
        self.delta = timedelta(**delta)

    def check_due(self, crawler_id):
        # should this be utcnow?
        _, last_run = CrawlerState.crawler_last_run(crawler_id)
        if last_run is None:
            return True
        now = datetime.now()
        if last_run > (now - CrawlerState.TIMEOUT):
            log.info("Crawler was active very recently. Skip due.")
            return False
        if now > last_run + self.delta:
            return True
        return False

    def to_dict(self):
        return self.name

    def __unicode__(self):
        return self.name
