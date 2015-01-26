import logging

from barn.ingest import Ingestor

from aleph.core import archive
from aleph.processing import make_pipeline

log = logging.getLogger(__name__)


class Crawler(object):
    COLLECTION = None
    LABEL = None
    URL = None

    def __init__(self):
        pass

    def crawl(self):
        raise NotImplemented()

    @property
    def collection(self):
        if not hasattr(self, '_collection'):
            self._collection = archive.get(self.COLLECTION)
        return self._collection

    @property
    def pipeline(self):
        if not hasattr(self, '_pipeline'):
            self._pipeline = make_pipeline(self.collection)
        return self._pipeline

    def meta_data(self, title=None, mime_type=None, extension=None,
                  source_url=None, source_file=None, article=False):
        return {
            'title': title,
            'mime_type': mime_type,
            'extension': extension,
            'source_url': source_url,
            'source_file': source_file,
            'crawler_label': self.LABEL,
            'crawler_url': self.URL,
            'extract_article': article
        }

    def emit_url(self, url, **kwargs):
        kwargs['source_url'] = url
        meta = self.meta_data(**kwargs)
        log.info("Crawler %r emitted URL: %r", self, url)
        for ingestor in Ingestor.analyze(url):
            try:
                package = self.collection.get(ingestor.hash())
                package.ingest(ingestor, meta=meta)
            finally:
                ingestor.dispose()
            self.process(package)

    def process(self, package):
        self.pipeline.process_package(package)

    def __repr__(self):
        return '<%s(%s, %s)>' % (self.__class__.__name__,
                                 self.LABEL, self.COLLECTION)
