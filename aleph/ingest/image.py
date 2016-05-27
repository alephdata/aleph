import os
import logging
import subprocess
from tempfile import mkstemp

from aleph.core import get_config
from aleph.ingest.ingestor import IngestorException
from aleph.ingest.text import TextIngestor

log = logging.getLogger(__name__)


class ImageIngestorException(IngestorException):
    pass


class ImageIngestor(TextIngestor):
    MIME_TYPES = ['image/png', 'image/tiff', 'image/x-tiff',
                  'image/jpeg', 'image/bmp', 'image/x-windows-bmp',
                  'image/x-portable-bitmap', 'application/postscript',
                  'image/vnd.dxf', 'image/svg+xml']
    EXTENSIONS = ['gif', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp',
                  'jpe', 'pbm']
    BASE_SCORE = 5

    def ingest(self, meta, local_path):
        try:
            fh, pdf_path = mkstemp(suffix='.pdf')
            os.close(fh)
            meta.title = meta.file_name
            convert = get_config('CONVERT_BIN')
            args = [convert, local_path, '-density', '300', '-define',
                    'pdf:fit-page=A4', pdf_path]
            subprocess.call(args)
            if pdf_path is None or not os.path.isfile(pdf_path):
                msg = "Could not convert image: %r" % meta
                raise ImageIngestorException(msg)
            self.store_pdf(meta, pdf_path)
            self.extract_pdf(meta, pdf_path)
        finally:
            if os.path.isfile(pdf_path):
                os.unlink(pdf_path)
