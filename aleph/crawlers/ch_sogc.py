import requests
import logging
from datetime import datetime, timedelta
from urlparse import urljoin
from lxml import html

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
BASE_URL = 'https://www.sogc.ch/shabforms/servlet/Search'
TYPES = ["BL", "KK", "SR", "HR", "UP", "NA", "SB", "IS", "AW",
         "IP", "AN", "VM", "AB"]
QUERY = {
    'SELTYPE': '',
    'SEARCH_SAVE': '',
    'KEYWORDS': '',
    'ORGANISATION_TX': '',
    'NOTICE_NR': '',
    'STAT_TM_1': '',
    'STAT_TM_2': '',
    # 'TIMESPAN': 'TOTAL',
    'TIMESPAN': 'VARIABLE',
    'command': 'Search'
}


class SwissCommercialGazette(Crawler):

    def crawl_record(self, source, row):
        cells = row.findall('./td')
        if not len(cells):
            return
        text = [c.text_content().strip() for c in cells]
        date, num, category, name, _ = text
        link = row.find('.//a[@class="pdfLnk"]')
        if link is None:
            return
        source_url = urljoin(BASE_URL, link.get('href'))
        meta = self.metadata()
        meta.languages = ['en', 'fr', 'de']
        meta.add_country('ch')
        meta.extension = 'pdf'
        meta.mime_type = 'application/pdf'
        meta.foreign_id = source_url
        # TODO: handle date
        title = '%s (%s, %s)' % (name, category, date)
        meta.title = title.replace('\n', ' - ')
        self.emit_url(source, meta, source_url)

    def crawl_set(self, source, date, type_):
        sess = requests.Session()
        query = QUERY.copy()
        query['STAT_TM_1'] = date
        query['STAT_TM_2'] = date
        query['SELTYPE'] = type_
        res = sess.post(BASE_URL, data=query)
        res = sess.post(BASE_URL, data={
            'MAX_LINES': 30,
            'EID': 1,
            'LANG': 'EN',
            'CUR_PAGE': 1,
            'MAX_LINES2': 30
        })
        page = 1
        while True:
            doc = html.fromstring(res.content.decode('utf-8'))
            rows = doc.findall('.//table[@id="resultList"]//tr')
            if len(rows) < 2:
                break
            for row in rows:
                self.crawl_record(source, row)
            page += 1
            page_url = BASE_URL + '?EID=1&PAGE=%s' % page
            res = sess.post(page_url)

    def crawl(self):
        source = self.create_source(label='Swiss Official Gazette of Commerce')
        date = datetime.utcnow()
        min_date = date - timedelta(days=5 * 365)
        while True:
            for type_ in TYPES:
                self.crawl_set(source, date.strftime('%d.%m.%Y'), type_)

            date = date - timedelta(days=1)
            if date < min_date:
                break
