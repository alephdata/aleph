import logging
from pkg_resources import iter_entry_points

from aleph.core import archive
from aleph.processing import ingest_url

log = logging.getLogger(__name__)
CRAWLERS = {}


def get_crawlers():
    if not CRAWLERS:
        for ep in iter_entry_points('aleph.crawlers'):
            CRAWLERS[ep.name] = ep.load()
    return CRAWLERS


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
        return self.config.get('label', self.name)

    @property
    def site(self):
        return self.config.get('site')

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


class Crawler(object):
    
    def __init__(self, source):
        self.source = source

    def crawl(self):
        raise NotImplemented()

    def meta_data(self, title=None, mime_type=None, extension=None,
                  source_url=None, source_file=None, article=False):
        data = {
            'title': title,
            'mime_type': mime_type,
            'extension': extension,
            'source_url': source_url,
            'source_file': source_file,
            'extract_article': article
        }
        return dict([(k, v) for k, v in data.items() if v is not None])

    def emit_url(self, url, **kwargs):
        meta = self.meta_data(**kwargs)
        meta['source_label'] = self.source.label
        meta['source_site'] = self.source.site
        ingest_url.delay(self.source.collection.name, url, meta=meta)

    def __repr__(self):
        return '<%s(%s, %s)>' % (self.__class__.__name__, self.source)
