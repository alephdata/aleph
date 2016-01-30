import os
import cgi
import yaml
import logging
import requests
import urlnorm
from urlparse import urljoin, urlparse, urldefrag
from lxml import html
from tempfile import mkstemp

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


def as_list(attr):
    if attr is None:
        return []
    if isinstance(attr, (list, set, tuple)):
        return attr
    return [attr]


def normalize_url(url):
    url = urlnorm.norm(url)
    url, _ = urldefrag(url)
    url = url.rstrip('/')
    return url


class WebCrawlerState(object):

    def __init__(self, crawler, source, config):
        self.crawler = crawler
        self.source = source
        self.config = config
        self.seen = set([])

    @property
    def session(self):
        if not hasattr(self, '_session'):
            self._session = requests.Session()
        return self._session

    @property
    def seeds(self):
        if not hasattr(self, '_seeds'):
            seeds = as_list(self.config.get('seed'))
            self._seeds = [normalize_url(s) for s in seeds]
        return self._seeds

    def queue(self, url):
        page = WebCrawlerPage(self, url)
        # TODO: add celery?
        page.process()

    def should_retain(self, page):
        if not self.should_process(page.normalized_url):
            return False
        return True

    def should_crawl(self, url):
        if normalize_url(url) in self.seen:
            return False
        if not self.should_process(url):
            return False
        return True

    def should_process(self, url):
        parsed = urlparse(url)

        for seed in self.seeds:
            sparsed = urlparse(seed)
            if parsed.hostname == sparsed.hostname:
                return True
            dom = '.%s' % sparsed.hostname
            if parsed.hostname.endswith(dom):
                return True
        return False

    def emit(self, page):
        meta = self.crawler.metadata()
        meta.data.update(self.config.get('meta', {}))
        meta.source_url = page.normalized_url
        meta.foreign_id = page.id
        meta.headers = page.response.headers

        from pprint import pprint
        pprint(meta.to_dict())

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

    @property
    def normalized_url(self):
        url = self.url
        if hasattr(self, '_response'):
            url = self._response.url
        return normalize_url(url)

    @property
    def id(self):
        return self.normalized_url

    @property
    def is_html(self):
        content_type = self.response.headers.get('content-type')
        if content_type is None:
            return True
        mime_type, _ = cgi.parse_header(content_type)
        if 'html' in mime_type:
            return True
        return False

    def parse(self):
        tags = [('a', 'href'), ('img', 'src'), ('link', 'href'),
                ('iframe', 'src')]

        urls = set([])
        for tag_name, attr_name in tags:
            for tag in self.doc.findall('.//%s' % tag_name):
                attr = tag.get(attr_name)
                if attr is None:
                    continue
                urls.add(urljoin(self.normalized_url, attr))

        for url in urls:
            self.state.queue(url)

    def process(self):
        if not self.state.should_crawl(self.normalized_url):
            return

        self.state.seen.add(self.normalized_url)
        if self.response.status_code > 300:
            return
        self.state.seen.add(self.normalized_url)

        if self.state.should_retain(self):
            self.retain()
        if self.is_html:
            self.parse()

    def retain(self):
        self.state.emit(self)


class WebCrawler(Crawler):

    name = 'web'

    def crawl_source(self, foreign_id, data):
        source = self.create_source(foreign_id=foreign_id,
                                    label=data.get('label'))

        state = WebCrawlerState(self, source, data)
        for url in state.seeds:
            page = WebCrawlerPage(state, url)
            page.process()

    def crawl(self, config=None, source=None):
        with open(config, 'rb') as fh:
            config = yaml.load(fh)
            for name, data in config.get('sources', {}).items():
                if source is None or source == name:
                    foreign_id = '%s:%s' % (self.name, name)
                    self.crawl_source(foreign_id, data)
