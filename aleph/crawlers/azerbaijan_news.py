import time
import requests
import logging
from urlparse import urljoin
from itertools import count
from lxml import html

from aleph.model import Source
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
BASE_URL = 'http://www.azerbaijan-news.az/'
FAILED_LIMIT = 1000


class AzerbaijanNewsCrawler(Crawler):

    def crawl_article(self, source, id):
        meta = self.metadata()
        meta['languages'] = ['az']
        meta['countries'] = ['az']
        meta.file_name = 'article_%s.htm' % id
        meta.extension = 'htm'
        meta.source_url = urljoin(BASE_URL, '/index.php?mod=3&id=%s' % id)
        res = requests.get(meta.source_url)
        if res.status_code >= 500:
            log.warning('Failed to load: %r', meta.source_url)
            # time.sleep(10)
            return True

        # print res.content
        doc = html.document_fromstring(res.content.decode('utf-8'))
        article = doc.find('.//article')
        if article is None:
            return False

        for m in doc.findall('.//meta'):
            name = m.get('name') or m.get('property')
            value = m.get('content')
            if name == 'og:title':
                meta.title = value
            if name == 'og:description':
                meta.summary = value

        body = html.Element('body')
        body.append(article)
        doc.find('.//body').drop_tree()
        doc.append(body)
        content = html.tostring(doc)
        self.emit_content(source, meta, content)
        return True

    def crawl(self):
        source = Source.create({
            'foreign_id': BASE_URL,
            'label': 'Azerbaijan State News'
        })

        failed_articles = 0
        for idx in count(80000):
            if self.crawl_article(source, idx):
                failed_articles = 0
            else:
                failed_articles += 1
                if failed_articles >= FAILED_LIMIT:
                    break
