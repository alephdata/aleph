from aleph.model import db, Source
from aleph.crawlers.crawler import get_crawlers, Crawler, TagExists # noqa


def crawl_source(slug, ignore_tags=False):
    Source.sync()
    source = Source.by_slug(slug)
    if source is None:
        source = Source.create(slug)
        db.session.commit()
    source.crawler.ignore_tags = ignore_tags
    source.crawler.crawl()
