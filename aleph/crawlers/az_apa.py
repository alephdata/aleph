import requests
import logging
from lxml import html

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
BASE_URL = 'http://en.apa.az/'
PAGE_URL = 'http://en.apa.az/print/%s'


class AzerbaijanPressAgency(Crawler):

    def crawl(self):
        source = self.create_source(label='Azerbaijan Press Agency')
        res = requests.get(BASE_URL)
        doc = html.fromstring(res.content)
        max_num = 0
        for a in doc.findall('.//div[@class="news_list"]//a'):
            _, num = a.get('href').replace('.html', '').rsplit('_', 1)
            max_num = max(int(num), max_num)

        meta = self.metadata()
        meta.add_language('en')
        meta.add_country('az')
        meta.extension = 'htm'
        meta.mime_type = 'text/html'

        for i in xrange(max_num, 1, -1):
            self.emit_url(source, meta, PAGE_URL % i)
