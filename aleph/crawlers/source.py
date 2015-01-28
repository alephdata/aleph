import logging

from aleph.core import archive
from aleph.crawlers.crawler import get_crawlers

log = logging.getLogger(__name__)


class Source(object):

    def __init__(self, name, config):
        self.name = name
        self.config = config

    @property
    def collection(self):
        if not hasattr(self, '_collection'):
            collection_name = self.config.get('collection', self.name)
            self._collection = archive.get(collection_name)
        return self._collection

    @property
    def label(self):
        fallback = self.crawler.DEFAULT_LABEL or self.name
        return self.config.get('label', fallback)

    @property
    def site(self):
        return self.config.get('site', self.crawler.DEFAULT_SITE)

    @property
    def crawler(self):
        if not hasattr(self, '_crawler'):
            crawler_name = self.config.get('crawler', self.name)
            cls = get_crawlers().get(crawler_name)
            if cls is None:
                log.error("Invalid source; no such crawler: %r", crawler_name)
            self._crawler = cls(self)
        return self._crawler

    def __repr__(self):
        return '<Source(%r)>' % self.name

    def __unicode__(self):
        return self.name
