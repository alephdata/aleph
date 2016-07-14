import os
import logging
import subprocess
from lxml import html, etree
from lxml.html.clean import Cleaner

from aleph.core import get_config
from aleph.ingest.ingestor import IngestorException
from aleph.ingest.document import DocumentIngestor
from aleph.util import make_tempfile, remove_tempfile

log = logging.getLogger(__name__)


class HtmlIngestor(DocumentIngestor):
    MIME_TYPES = ['text/html']
    EXTENSIONS = ['html', 'htm', 'asp', 'aspx', 'jsp']

    cleaner = Cleaner(scripts=True, javascript=True, style=True, links=True,
                      embedded=True, forms=True, frames=True,
                      annoying_tags=True, meta=False, remove_tags=['a'])

    def handle_html(self, meta, html_path):
        """OK, this is weirder. Converting HTML to PDF via WebKit."""
        out_path = make_tempfile(name=meta.file_name, suffix='pdf')
        try:
            wkhtmltopdf = get_config('WKHTMLTOPDF_BIN')
            args = [wkhtmltopdf, '--disable-javascript', '--no-outline',
                    '--no-images', '--quiet', html_path, out_path]
            subprocess.call(args)
            if not os.path.isfile(out_path):
                raise IngestorException("Could not convert document: %r", meta)
            self.extract_pdf_alternative(meta, out_path)
        finally:
            remove_tempfile(out_path)

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as fh:
            data = fh.read()
        if meta.encoding:
            data = data.decode(meta.encoding)
        doc = html.fromstring(data)
        if not meta.has('title'):
            title = doc.findtext('.//title')
            if title is not None:
                meta.title = title

        if not meta.has('summary'):
            summary = doc.find('.//meta[@name="description"]')
            if summary is not None and summary.get('content'):
                meta.summary = summary.get('content')

        for field in ['keywords', 'news_keywords']:
            value = doc.find('.//meta[@name="%s"]' % field)
            if value is not None:
                value = value.get('content') or ''
                for keyword in value.split(','):
                    meta.add_keyword(keyword)

        self.cleaner(doc)
        out_path = make_tempfile(name=meta.file_name, suffix='htm')
        try:
            with open(out_path, 'w') as fh:
                fh.write(etree.tostring(doc))
            self.handle_html(meta, out_path)
        finally:
            remove_tempfile(out_path)
