from pkg_resources import iter_entry_points

from aleph.model import Source
from aleph.core import celery
from aleph.crawlers.crawler import Crawler # noqa

CRAWLERS = {}


def get_crawlers():
    if not CRAWLERS:
        for ep in iter_entry_points('aleph.crawlers'):
            CRAWLERS[ep.name] = ep.load()
    return CRAWLERS


@celery.task()
def crawl_source(slug, ignore_tags=False):
    Source.sync()
    source = Source.by_slug(slug)
    if source is None:
        raise ValueError("Invalid source: %r" % slug)
    source.crawler_instance.ignore_tags = ignore_tags
    source.crawler_instance.crawl()
