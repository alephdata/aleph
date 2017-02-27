import os
import logging
import requests
from lxml import etree
from urlparse import urljoin
from itertools import count
from requests.auth import HTTPBasicAuth
from pycountry import languages

from aleph.crawlers.crawler import DocumentCrawler

log = logging.getLogger(__name__)


class WebDAVCrawler(DocumentCrawler):
    BASE_URL = 'https://documentcloud.org/'
    USER = None
    PASSWORD = None

    def crawl_document(self, url, auth):
        if self.skip_incremental(url):
            return
        log.info("WebDAV Fetch [%s]: %s", self.COLLECTION_ID, url)

        meta = self.make_meta({
            'source_url': url,
            'foreign_id': url,
        })

        res = requests.get(url, auth=auth)
        file_path = self.save_data(res.content)
        meta.headers = res.headers
        self.emit_file(meta, file_path, move=True)

    def crawl_collection(self, url, auth):
        log.info("WebDAV Index [%s]: %s", self.COLLECTION_ID, url)
        res = requests.request('PROPFIND', url, auth=auth)
        doc = etree.fromstring(res.content)
        for response in doc.findall('./{DAV:}response'):
            href = response.findtext('./{DAV:}href')
            if href is None:
                continue
            href = urljoin(url, href)
            if href == url:
                continue
            is_collection = response.find('.//{DAV:}collection')
            if is_collection is not None:
                self.crawl_collection(href, auth)
            else:
                self.crawl_document(href, auth)

    def crawl(self):
        auth = HTTPBasicAuth(self.USER, self.PASSWORD)
        self.crawl_collection(self.BASE_URL, auth)
