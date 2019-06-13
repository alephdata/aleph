import logging
from datetime import datetime

log = logging.getLogger(__name__)


class MediaInfoDateMixIn(object):

    def parse_date(self, text):
        try:
            return datetime.strptime(text, "%Z %Y-%m-%d %H:%M:%S")
        except Exception:
            log.warning("Cannot parse date: %s", text)
            return None
