from pkg_resources import iter_entry_points

CRAWLERS = {}


def crawlers():
    if not CRAWLERS:
        for ep in iter_entry_points('aleph.crawlers'):
            CRAWLERS[ep.name] = ep.load()
    return CRAWLERS


def run_crawler(name):
    if name not in crawlers():
        raise TypeError('Unknown crawler type: %r' % name)
    crawler = crawlers().get(name)()
    crawler.crawl()
