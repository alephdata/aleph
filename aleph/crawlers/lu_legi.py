import requests
import logging
from datetime import datetime
from lxml import html

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
BASE_URL = 'http://www.legilux.public.lu/entr/archives/index.php?year=%s'
YEARS = range(1996, datetime.utcnow().year + 1)


class LuxembourgGazette(Crawler):

    def crawl_record(self, source, source_url, title):
        if self.foreign_id_exists(source, source_url):
            # assuming they're immutable
            return
        meta = self.metadata()
        meta.title = title
        meta.languages = ['fr']
        meta.add_country('lu')
        meta.extension = 'pdf'
        meta.mime_type = 'application/pdf'
        meta.foreign_id = source_url
        # TODO: handle date
        self.emit_url(source, meta, source_url)

    def crawl(self):
        source = self.create_source(label='Luxembourg Journal Officiel')
        for year in YEARS:
            url = BASE_URL % year
            res = requests.get(url)
            doc = html.fromstring(res.content)
            for link in doc.findall('.//a'):
                href = link.get('href')
                if href is None or 'etat.lu' not in href \
                        or not href.endswith('.pdf'):
                    continue
                title = link.text_content()
                title = 'Luxembourg Journal %s (%s)' % (title, year)
                self.crawl_record(source, href, title)
