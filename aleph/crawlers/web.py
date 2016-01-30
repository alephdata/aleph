import os
import yaml
import logging
import requests
from lxml import html
from tempfile import mkstemp
from sqlalchemy import create_engine

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


def as_list(attr):
    if attr is None:
        return []
    if isinstance(attr, (list, set, tuple)):
        return attr
    return [attr]


class WebCrawlerState(object):

    def __init__(self, crawler, source, config):
        self.source = source
        self.config = config
        self.seen_urls = set([])

    @property
    def session(self):
        if not hasattr(self, '_session'):
            self._session = requests.Session()
        return self._session

    def emit(self, page):
        meta = self.metadata()
        meta.data.update(self.config.get('meta', {}))
        meta.source_url = page.url
        meta.headers = page.response.headers

        fh, file_path = mkstemp(suffix='.%s' % meta.extension)
        try:
            fh = os.fdopen(fh, 'w')
            fh.write(page.response.content)
            fh.close()
            self.crawler.emit_file(self.source, meta,
                                   file_path, move=True)
        except Exception as ex:
            log.exception(ex)
        finally:
            if os.path.isfile(file_path):
                os.unlink(file_path)


class WebCrawlerPage(object):

    def __init__(self, state, url):
        self.state = state
        self.url = url

    @property
    def response(self):
        if not hasattr(self, '_response'):
            self._response = self.state.session.get(self.url)
        return self._response

    @property
    def doc(self):
        if not hasattr(self, '_doc'):
            self._doc = html.fromstring(self.response.content)
        return self._doc

    def process(self):
        # res = requests.get(self.url)
        print self.doc


class WebCrawler(Crawler):

    name = 'web'

    def crawl_source(self, foreign_id, data):
        source = self.create_source(foreign_id=foreign_id,
                                    label=data.get('label'))

        state = WebCrawlerState(self, source, data)
        for url in as_list(data.get('seed')):
            page = WebCrawlerPage(state, url)
            page.process()

    def crawl(self, config=None, source=None):
        with open(config, 'rb') as fh:
            config = yaml.load(fh)
            for name, data in config.get('sources', {}).items():
                if source is None or source == name:
                    foreign_id = '%s:%s' % (self.name, name)
                    self.crawl_source(foreign_id, data)
