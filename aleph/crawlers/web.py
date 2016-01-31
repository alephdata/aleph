import os
import cgi
import yaml
import logging
from lxml import html
from tempfile import mkstemp
from krauler import Krauler

from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)


class AlephKrauler(Krauler):

    def __init__(self, crawler, source, config):
        self.crawler = crawler
        self.source = source
        super(AlephKrauler, self).__init__(config)

    def get_content(self, page):
        if not page.is_html:
            return page.content

        for path in self.config.get('remove_paths', []):
            for el in page.doc.findall(path):
                el.drop_tree()

        return html.tostring(page.doc)

    def emit(self, page):
        meta = self.crawler.metadata()
        meta.data.update(self.config.get('meta', {}))
        meta.source_url = page.normalized_url
        meta.foreign_id = page.id
        if page.file_name:
            meta.file_name = page.file_name
        meta.mime_type = page.mime_type
        meta.headers = page.response.headers

        fh, file_path = mkstemp(suffix='.%s' % meta.extension)
        try:
            fh = os.fdopen(fh, 'w')
            fh.write(self.get_content(page))
            fh.close()
            self.crawler.emit_file(self.source, meta,
                                   file_path, move=True)
        except Exception as ex:
            log.exception(ex)
        finally:
            if os.path.isfile(file_path):
                os.unlink(file_path)


class WebCrawler(Crawler):

    name = 'web'

    def crawl_source(self, foreign_id, data):
        source = self.create_source(foreign_id=foreign_id,
                                    label=data.get('label'))

        krauler = AlephKrauler(self, source, data)
        krauler.run()

    def crawl(self, config=None, source=None):
        with open(config, 'rb') as fh:
            config = yaml.load(fh)
            for name, data in config.get('sources', {}).items():
                if source is None or source == name:
                    foreign_id = '%s:%s' % (self.name, name)
                    self.crawl_source(foreign_id, data)
