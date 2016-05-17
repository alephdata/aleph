import os
import logging
import subprocess
from tempfile import mkstemp
from lxml import html, etree
from lxml.html.clean import Cleaner

from aleph.core import get_config
from aleph.ingest.document import DocumentIngestor

log = logging.getLogger(__name__)


class HtmlIngestor(DocumentIngestor):
    MIME_TYPES = ['text/html']
    EXTENSIONS = ['html', 'htm', 'asp', 'aspx', 'jsp']

    cleaner = Cleaner(scripts=True, javascript=True, style=True, links=True,
                      embedded=True, forms=True, annoying_tags=True,
                      meta=False)

    def generate_pdf_version(self, html_path):
        """OK, this is weirder. Converting HTML to PDF via WebKit."""
        fh, out_path = mkstemp(suffix='.pdf')
        os.close(fh)
        wkhtmltopdf = get_config('WKHTMLTOPDF_BIN')
        args = [wkhtmltopdf, '--disable-javascript', '--no-outline',
                '--no-images', '--quiet', html_path, out_path]
        subprocess.call(args)
        return out_path

    def ingest(self, meta, local_path):
        fh, out_path = mkstemp(suffix='.htm')
        os.close(fh)
        with open(local_path, 'rb') as fh:
            doc = html.fromstring(fh.read())
            if not meta.has('title'):
                title = doc.findtext('.//title')
                if title is not None:
                    meta.title = title.strip()

            if not meta.has('summary'):
                summary = doc.find('.//meta[@name="description"]')
                if summary is not None and summary.get('content'):
                    meta.summary = summary.get('content')

            self.cleaner(doc)
        try:
            with open(out_path, 'w') as fh:
                fh.write(etree.tostring(doc))

            pdf_path = self.generate_pdf_version(out_path)
            if pdf_path is None or not os.path.isfile(pdf_path):
                raise IOError("Could not convert document: %r", meta)
            self.extract_pdf_alternative(meta, pdf_path)
        finally:
            if os.path.isfile(out_path):
                os.unlink(out_path)
