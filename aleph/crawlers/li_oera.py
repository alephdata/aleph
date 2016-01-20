import requests
import logging
from datetime import datetime, timedelta

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
BASE_URL = 'http://www.oera.li/publ/FL%s.pdf'
BEGIN = datetime(2007, 1, 1)
END = datetime(2012, 12, 29)


class LiechtensteinOld(Crawler):

    def crawl_record(self, source, date):
        source_url = BASE_URL % date.strftime('%Y%m%d')
        res = requests.head(source_url)
        if res.status_code != 200:
            return
        meta = self.metadata()
        date_str = date.strftime('%d.%m.%Y')
        meta.title = 'Liechtenstein Kundmachungen %s' % date_str
        meta.languages = ['de']
        meta.add_country('li')
        meta.extension = 'pdf'
        meta.add_date(date)
        meta.mime_type = 'application/pdf'
        meta.foreign_id = source_url
        self.emit_url(source, meta, source_url)

    def crawl(self):
        source = self.create_source(label='Liechtenstein Company Index')
        date = BEGIN
        while True:
            date = date + timedelta(days=1)
            if date > END:
                break
            try:
                self.crawl_record(source, date)
            except Exception as ex:
                log.warning(ex)
