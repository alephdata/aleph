import os
import logging
import subprocess
from PIL import Image

from aleph.core import get_config
from aleph.ingest.ingestor import IngestorException
from aleph.ingest.text import TextIngestor
from aleph.util import make_tempfile, remove_tempfile

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
    MIN_WIDTH = 100
    MIN_HEIGHT = 100

    def check_image_size(self, meta, local_path):
        try:
            with open(local_path, 'r') as fh:
                img = Image.open(fh)
                if img.width < self.MIN_WIDTH or img.height < self.MIN_HEIGHT:
                    log.warn("Image too small [%r]: %s", meta, img.size)
                    return False
                return True
        except Exception as exc:
            log.info("Cannot parse image: %s", exc)
            return True

    def ingest(self, meta, local_path):
        pdf_path = make_tempfile(name=meta.file_name, suffix='pdf')
        try:
            meta.title = meta.file_name
            if not self.check_image_size(meta, local_path):
                return
            convert = get_config('CONVERT_BIN')
            args = [convert, local_path, '-density', '450', '-define',
                    'pdf:fit-page=A4', pdf_path]
            subprocess.call(args)
            if not os.path.isfile(pdf_path):
                msg = "Could not convert image: %r" % meta
                raise ImageIngestorException(msg)
            self.store_pdf(meta, pdf_path)
            self.extract_pdf(meta, pdf_path)
        finally:
            remove_tempfile(pdf_path)
