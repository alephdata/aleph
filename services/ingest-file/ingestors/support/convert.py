import math
import logging
import requests
import pypandoc
from servicelayer.util import backoff, service_retries
from followthemoney.helpers import entity_filename

from ingestors.support.cache import CacheSupport
from ingestors.support.temp import TempFileSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class DocumentConvertSupport(CacheSupport, TempFileSupport):
    """Provides helpers for document conversion via pandoc."""

    def document_to_pdf(self, file_path, entity):
        key = self.cache_key('pdf', entity.first('contentHash'))
        pdf_hash = self.get_cache_value(key)
        if pdf_hash is not None:
            file_name = entity_filename(entity, extension='pdf')
            path = self.manager.load(pdf_hash, file_name=file_name)
            if path is not None:
                log.info("Using PDF cache: %s", file_name)
                entity.set('pdfHash', pdf_hash)
                return path

        pdf_file = self._document_to_pdf(file_path, entity)
        if pdf_file is not None:
            content_hash = self.manager.store(pdf_file)
            entity.set('pdfHash', content_hash)
            self.set_cache_value(key, content_hash)
        return pdf_file

    def _document_to_pdf(self, file_path, entity):
        """Converts a document to PDF using pandoc."""
        # Attempt to guess an appropriate time for processing
        # Guessed: 15s per MB of data, max.
        file_size = file_path.stat().st_size
        if file_size < 100:
            raise ProcessingException("Document too small.")
        file_size = (file_size / 1024) / 1024  # megabyte
        timeout = int(min(600, max(20, file_size * 15)))

        file_name = entity_filename(entity)
        mime_type = entity.first('mimeType')
        log.info('Converting [%s] to PDF (%ds timeout)...',
                 file_name, timeout)
        failed = ProcessingException("Document could not be converted to PDF.")
        for attempt in service_retries():
            try:
                out_path = self.make_work_file('out.pdf')
                pypandoc.convert_file(file_path, 'pdf', outputfile=out_path)
                return out_path
            except Exception as exc:
                log.error("Conversion failed: %s", exc)
                backoff(failures=math.sqrt(attempt))
        raise failed
