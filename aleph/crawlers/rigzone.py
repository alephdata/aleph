import logging
from lxml import etree

from aleph.crawlers.common import Crawler

RSS_FEED = 'http://www.rigzone.com/news/rss/rigzone_latest.aspx'
PAGE_URL = 'http://www.rigzone.com/news/article_pf.asp?a_id=%s'

log = logging.getLogger(__name__)


class RigZoneCrawler(Crawler):

    LABEL = "RigZone"
    COLLECTION = "rigzone"
    URL = "http://www.rigzone.com/"

    def crawl(self):
        feed = etree.parse(RSS_FEED)
        url = feed.findtext('.//item/link')
        id = int(url.split('/a/', 1)[-1].split('/', 1)[0])
        for article_id in xrange(id, 1, -1):
            url = PAGE_URL % article_id
            self.emit_url(url, article=True)
