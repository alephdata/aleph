from aleph.core import app
from aleph.crawlers.source import Source
from aleph.crawlers.crawler import Crawler, TagExists # noqa

SOURCES = {}


def get_sources():
    if not len(SOURCES):
        for name, config in app.config.get('SOURCES').items():
            SOURCES[name] = Source(name, config)
    return SOURCES


def crawl_source(name, ignore_tags=False):
    source = get_sources().get(name)
    if source is None:
        raise ValueError("Source does not exist: %r" % name)
    source.crawler.ignore_tags = ignore_tags
    source.crawler.crawl()
