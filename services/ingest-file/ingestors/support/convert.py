import math
import logging
import requests
from requests import RequestException, HTTPError
from servicelayer.util import backoff, service_retries
from followthemoney.helpers import entity_filename

from ingestors.settings import CONVERT_URL
from ingestors.support.cache import CacheSupport
from ingestors.support.temp import TempFileSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class DocumentConvertSupport(CacheSupport, TempFileSupport):
    """Provides helpers for UNO document conversion via HTTP."""

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
        """Converts an office document to PDF."""
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
                with open(file_path, 'rb') as fh:
                    files = {'file': (file_name, fh, mime_type)}
                    res = requests.post(CONVERT_URL,
                                        params={'timeout': timeout},
                                        files=files,
                                        timeout=timeout + 3,
                                        stream=True)
                res.raise_for_status()
                out_path = self.make_work_file('out.pdf')
                with open(out_path, 'wb') as fh:
                    bytes_written = 0
                    for chunk in res.iter_content(chunk_size=None):
                        bytes_written += len(chunk)
                        fh.write(chunk)
                    if bytes_written > 50:
                        return out_path
                raise failed
            except RequestException as exc:
                if isinstance(exc, HTTPError) and \
                        exc.response.status_code == 400:
                    raise ProcessingException(res.text)
                log.error("Conversion failed: %s", exc)
                backoff(failures=math.sqrt(attempt))
        raise failed
