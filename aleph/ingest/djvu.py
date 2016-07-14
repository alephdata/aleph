import logging
import subprocess

from aleph.core import get_config
from aleph.ingest.document import DocumentIngestor
from aleph.util import make_tempfile

log = logging.getLogger(__name__)


class DjVuIngestor(DocumentIngestor):
    MIME_TYPES = ['image/vnd.djvu', 'image/x.djvu']  # noqa
    EXTENSIONS = ['djv', 'djvu']
    BASE_SCORE = 5

    def generate_pdf_alternative(self, meta, local_path):
        """Convert DjVu book to PDF."""
        out_path = make_tempfile(meta.file_name, suffix='pdf')
        ddjvu = get_config('DDJVU_BIN')
        args = [ddjvu, '-format=pdf', '-quality=85', '-skip',
                local_path, out_path]
        log.debug('Converting DJVU book: %r', ' '.join(args))
        subprocess.call(args, stderr=subprocess.STDOUT)
        return out_path
