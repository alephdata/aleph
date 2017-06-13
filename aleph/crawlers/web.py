import logging
from lxml import html
from krauler import Krauler

from aleph.crawlers.crawler import DocumentCrawler

log = logging.getLogger(__name__)


class AlephKrauler(Krauler):

    def __init__(self, crawler):
        self.crawler = crawler
        super(AlephKrauler, self).__init__({
            'crawl': crawler.CRAWL_RULES,
            'retain': crawler.RETAIN_RULES,
            'seed': crawler.SEED,
            'user_agent': 'Mozilla/5.0 (aleph/krauler)'
        })

    def emit(self, page):
        self.crawler.emit(page)


class WebCrawler(DocumentCrawler):

    CRAWL_RULES = {'match_all': {}}
    RETAIN_RULES = {'match_all': {}}
    SEED = []
    META = {}
    CHECK_PATH = None
    REMOVE_PATHS = None

    def crawl(self):
        AlephKrauler(self).run()

    def get_content(self, page):
        if not page.is_html:
            return page.content

        if self.CHECK_PATH is not None:
            if page.doc.find(self.CHECK_PATH) is None:
                log.info("Failed XML path check: %r", page.url)
                return None

        body = page.doc
        for path in self.REMOVE_PATHS:
            for el in body.findall(path):
                el.drop_tree()
        return html.tostring(body)

    def emit(self, page):
        if self.skip_incremental(page.url):
            log.info("Skip: %r", page.url)

        document = self.create_document(foreign_id=page.url)
        if page.is_html:
            data = self.get_content(page)
            file_path = self.save_data(data)
        else:
            file_path = self.save_response(page.response)

        document.source_url = page.url
        if page.file_name and len(page.file_name.strip()) > 2:
            document.file_name = page.file_name
        document.mime_type = page.mime_type
        document.headers = page.response.headers
        log.info("Importing %r", page.url)
        self.emit_file(document, file_path)
