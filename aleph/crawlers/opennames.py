from urlparse import urljoin
import requests
import logging

from aleph.core import app
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class OpenNamesCrawler(Crawler):

    def crawl(self):
        pass
