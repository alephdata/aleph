import os
import requests
import logging
from lxml import etree, html
from tempfile import mkstemp
import dateparser
# from datetime import datetime, timedelta

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
RSS_URL = 'http://apps-rss.llv.li/amtsblatt/rubrik/HRKU'
BASE_URL = 'https://apps.llv.li/amtsblatt/kundmachung/display/%s'
PRINT_URL = 'https://apps.llv.li/amtsblatt/kundmachung/printPub'
CATEGORIES = ['HREIN', 'STEUER', 'EDKURLG', 'GLB', 'HRKU', 'KONZ',
              'GBBER', 'VAUFT', 'ZWLI', 'ZUST']


class LiechtensteinAmtsblatt(Crawler):

    def crawl_record(self, source, notice_id):
        if self.foreign_id_exists(source, notice_id):
            # assuming they're immutable
            return
        url = BASE_URL % notice_id
        sess = requests.Session()
        res = sess.get(url, allow_redirects=False)
        # print res.status_code, res.url
        if res.status_code != 200:
            log.info("Notice ID %s got response: %r", notice_id, res)
            return

        doc = html.fromstring(res.content)
        category = doc.find('.//div[@class="details"]//a')
        if category is None:
            return
        if category.get('href').split('/')[-1] not in CATEGORIES:
            return

        meta = self.metadata()
        meta.languages = ['de']
        meta.add_country('li')
        meta.extension = 'pdf'
        meta.mime_type = 'application/pdf'
        meta.foreign_id = notice_id
        meta.title = doc.findtext('.//div[@class="body"]//h3')

        date = doc.findtext('.//div[@class="details"]/span[@class="datum"]')
        meta.add_date(dateparser.parse(date))

        fh, file_path = mkstemp(suffix='.pdf')
        try:
            res = sess.get(PRINT_URL, stream=True)
            fh = os.fdopen(fh, 'w')
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
            fh.close()
            log.info("Importing %r to %r", meta.title, source)
            self.emit_file(source, meta, file_path, move=True)
        except Exception as ex:
            log.exception(ex)
        finally:
            if os.path.isfile(file_path):
                os.unlink(file_path)

    def crawl(self):
        source = self.create_source(label='Liechtenstein Amtsblatt')
        doc = etree.parse(RSS_URL)
        link = doc.findtext('.//item/link')
        if link is None:
            log.error("No RSS link found.")
        else:
            max_id = int(link.rsplit('/')[-1]) + 50
            for notice_id in xrange(max_id, 1, -1):
                self.crawl_record(source, notice_id)
