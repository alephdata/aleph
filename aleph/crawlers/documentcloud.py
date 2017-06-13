import os
import logging
import requests
from urlparse import urljoin
from itertools import count
from dateutil.parser import parse
from pycountry import languages

from aleph.crawlers.crawler import DocumentCrawler

log = logging.getLogger(__name__)


class DocumentCloudCrawler(DocumentCrawler):
    DC_HOST = 'https://documentcloud.org/'
    DC_INSTANCE = 'documentcloud'
    DC_GROUP = None
    DC_QUERY = None

    def crawl_document(self, document):
        foreign_id = '%s:%s' % (self.DC_INSTANCE, document.get('id'))

        if self.skip_incremental(foreign_id):
            return

        document = self.create_document(foreign_id=foreign_id)
        document.source_url = document.get('canonical_url')
        document.title = document.get('title')
        document.author = document.get('author')
        document.file_name = os.path.basename(document.get('pdf_url'))
        document.mime_type = 'application/pdf'

        try:
            created = parse(document.get('created_at'))
            document.add_date(created.date().isoformat())
        except:
            pass
        try:
            lang = languages.get(iso639_3_code=document.get('language'))
            document.add_language(lang.iso639_1_code)
        except:
            pass

        self.emit_url(document, document.get('pdf_url'))

    def crawl(self):
        search_url = urljoin(self.DC_HOST, 'search/documents.json')
        query = self.DC_QUERY or '*:*'
        if self.DC_GROUP:
            query = 'group:"%s"' % self.DC_GROUP
        for page in count(1):
            res = requests.get(search_url, params={
                'q': query,
                'per_page': 999,
                'page': page
            })
            data = res.json()
            documents = data.get('documents')
            if not len(documents):
                break
            for document in documents:
                self.crawl_document(document)


class SourceAfricaCrawler(DocumentCloudCrawler):
    DC_HOST = 'http://dc.sourceafrica.net/'
    DC_INSTANCE = 'sourceafrica'
    COLLECTION_ID = 'sourceafrica'
    COLLECTION_LABEL = 'SourceAfrica.net'
