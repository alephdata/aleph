import logging

from aleph.model.metadata import Metadata
from aleph.ingest import ingest_url, ingest_file

log = logging.getLogger(__name__)


class Crawler(object):

    def __init__(self, source):
        self.source = source

    def crawl(self, **kwargs):
        raise NotImplemented()

    def metadata(self):
        return Metadata(data={
            'crawler': self.__class__.__name__
        })

    def emit_url(self, meta, url):
        ingest_url.delay(self.source.id, meta, url)

    def emit_file(self, meta, file_path):
        ingest_file(self.source.id, meta, file_path)

    def __repr__(self):
        return '<%s()>' % self.__class__.__name__
