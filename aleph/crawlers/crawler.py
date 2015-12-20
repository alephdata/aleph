import logging

from aleph.ingest import ingest_url, ingest_file

log = logging.getLogger(__name__)


class Crawler(object):

    def __init__(self, source):
        self.source = source

    def crawl(self):
        raise NotImplemented()

    def emit_url(self, meta, url):
        ingest_url.delay(meta, url)

    def emit_file(self, meta, file_name):
        # TODO: handle source
        ingest_file(meta, file_name)

    def __repr__(self):
        return '<%s()>' % self.__class__.__name__
