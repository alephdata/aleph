import os
import requests
import logging
from lxml import etree, html
from tempfile import mkstemp
import dateparser
# from datetime import datetime, timedelta

from aleph.core import app
from aleph.crawlers.crawler import Crawler

log = logging.getLogger(__name__)
BASE_URL = 'https://wikileaks.org/plusd/cables/%s.html'
BASE_DIRECTORY = os.environ.get("WL_CABLES_PATH", app.config.get("WL_CABLES_PATH"))


class WikileaksCables(Crawler):

    def crawl_cable(self, source, file_path):
        with open(file_path, 'r') as fh:
            doc = html.parse(fh)

        for path in ['.//div[@class="pane small"]', './/div[@id="help_1"]',
                     './/div[@id="help_2"]', './/script', './/link']:
            el = doc.find(path)
            el.drop_tree()

        meta = self.metadata()
        meta.add_language('en')
        meta.add_country('us')
        meta.extension = 'html'
        meta.mime_type = 'text/html'

        title = doc.findtext('.//h3')
        if title is not None:
            meta.title = title.replace('Viewing cable', '').strip()

        for cell in doc.findall('.//table[@class="cable"]//a'):
            href = cell.get('href')
            if '/cable/' in href:
                meta.foreign_id = cell.text.strip()
            elif '/date/' in href:
                meta.add_date(dateparser.parse(cell.text.strip()))
            elif '/reldate/' in href:
                meta.add_date(dateparser.parse(cell.text.strip()))

        if self.foreign_id_exists(source, meta.foreign_id):
            return

        meta.source_url = BASE_URL % meta.foreign_id
        meta.file_name = os.path.basename(file_path)

        fh, file_path = mkstemp(suffix='.html')
        try:
            fh = os.fdopen(fh, 'w')
            fh.write(html.tostring(doc))
            fh.close()
            log.info("Importing %r to %r", meta.title, source)
            self.emit_file(source, meta, file_path, move=True)
        except Exception as ex:
            log.exception(ex)
        finally:
            if os.path.isfile(file_path):
                os.unlink(file_path)

    def crawl(self):
        if BASE_DIRECTORY is None:
            raise ValueError("$WL_CABLES_PATH is not set.")
        source = self.create_source(label='Wikileaks State Department Cables')
        for (dirpath, _, files) in os.walk(BASE_DIRECTORY):
            for file_name in files:
                file_path = os.path.join(dirpath, file_name)
                self.crawl_cable(source, file_path)
