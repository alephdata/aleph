from aleph.model import Source
from aleph.core import celery
from aleph.crawlers.crawler import get_crawlers, Crawler, TagExists # noqa


@celery.task()
def crawl_source(slug, ignore_tags=False):
    Source.sync()
    source = Source.by_slug(slug)
    if source is None:
        raise ValueError("Invalid source: %r" % slug)
    source.crawler_instance.ignore_tags = ignore_tags
    source.crawler_instance.crawl()
