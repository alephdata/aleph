import math
import logging
import requests
from itertools import count
from requests import RequestException, HTTPError
from servicelayer.util import backoff
from followthemoney.helpers import entity_filename

from ingestors.settings import CONVERT_URL, CONVERT_TIMEOUT
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
        file_name = entity_filename(entity)
        mime_type = entity.first('mimeType')
        log.info('Converting [%s] to PDF...', file_name)
        for attempt in count(1):
            try:
                with open(file_path, 'rb') as fh:
                    files = {'file': (file_name, fh, mime_type)}
                    res = requests.post(CONVERT_URL,
                                        params={'timeout': CONVERT_TIMEOUT},
                                        files=files,
                                        timeout=CONVERT_TIMEOUT + 10,
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
                raise ProcessingException("Could not be converted to PDF.")
            except HTTPError as exc:
                if exc.response.status_code == 400:
                    raise ProcessingException(res.text)
                msg = "Converter not availble: %s (attempt: %s)"
                log.info(msg, exc, attempt)
                backoff(failures=math.sqrt(attempt))
            except RequestException as exc:
                msg = "Converter not availble: %s (attempt: %s)"
                log.error(msg, exc, attempt)
                backoff(failures=math.sqrt(attempt))
