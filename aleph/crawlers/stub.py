import logging

from aleph.crawlers.crawler import DocumentCrawler

log = logging.getLogger(__name__)


class StubCrawler(DocumentCrawler):
    SOURCE_ID = 'stub'
    SOURCE_LABEL = 'Stub Source'
    SCHEDULE = DocumentCrawler.DAILY

    def crawl(self):
        log.info("Stub crawler is being executed.")
        if self.incremental:
            log.info("Stubbing incrementally :)")
