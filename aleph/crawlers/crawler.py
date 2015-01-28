import logging
from hashlib import sha1
from pkg_resources import iter_entry_points

from aleph.core import db
from aleph.model import CrawlState
from aleph.processing import ingest_url

log = logging.getLogger(__name__)
CRAWLERS = {}


def get_crawlers():
    if not CRAWLERS:
        for ep in iter_entry_points('aleph.crawlers'):
            CRAWLERS[ep.name] = ep.load()
    return CRAWLERS


class TagExists(Exception):
    pass


class Crawler(object):

    DEFAULT_LABEL = None
    DEFAULT_SITE = None

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

    def make_tag(self, title=None, url=None, **kwargs):
        kwargs['title'] = title
        kwargs['url'] = url
        kwargs = [repr((k, unicode(v))) for k, v in kwargs.items()]
        return sha1('$'.join(kwargs)).hexdigest()

    def check_tag(self, tag=None, title=None, url=None, **kwargs):
        if tag is None:
            tag = self.make_tag(title=title, url=url, **kwargs)
        if CrawlState.check(tag):
            log.debug("Skipping %r, tagged as done.", tag)
            raise TagExists()
        CrawlState.create(self.source, tag)
        db.session.commit()

    def __repr__(self):
        return '<%s(%s, %s)>' % (self.__class__.__name__, self.source)
