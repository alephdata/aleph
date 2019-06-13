import logging
import requests
from normality import stringify
from pantomime.types import DEFAULT
from requests import RequestException, HTTPError
from servicelayer.cache import get_redis, make_key
from servicelayer.util import backoff, service_retries
from servicelayer.settings import REDIS_LONG

from ingestors.settings import UNOSERVICE_URL
from ingestors.support.temp import TempFileSupport
from ingestors.exc import ProcessingException

log = logging.getLogger(__name__)


class DocumentConvertSupport(TempFileSupport):
    """Provides helpers for UNO document conversion via HTTP."""

    def document_to_pdf(self, file_path, entity):
        conn = get_redis()
        key = make_key('pdf', entity.first('contentHash'))
        if conn.exists(key):
            log.info("Using [%s] PDF from cache", entity.first('fileName'))
            pdf_hash = stringify(conn.get(key))
            entity.set('pdfHash', pdf_hash)
            if pdf_hash is not None:
                work_path = self.manager.work_path
                return self.manager.archive.load_file(pdf_hash,
                                                      temp_path=work_path)

        pdf_file = self._document_to_pdf(file_path, entity)
        if pdf_file is not None:
            content_hash = self.manager.archive.archive_file(pdf_file)
            entity.set('pdfHash', content_hash)
            conn.set(key, content_hash, ex=REDIS_LONG)
            return pdf_file

    def _document_to_pdf(self, file_path, entity):
        """Converts an office document to PDF."""
        if UNOSERVICE_URL is None:
            raise RuntimeError("No UNOSERVICE_URL for document conversion.")
        log.info('Converting [%s] to PDF...', entity.first('fileName'))
        file_name = entity.first('fileName') or 'data'
        mime_type = entity.first('mimeType') or DEFAULT
        attempt = 1
        for attempt in service_retries():
            fh = open(file_path, 'rb')
            try:
                files = {'file': (file_name, fh, mime_type)}
                res = requests.post(UNOSERVICE_URL,
                                    files=files,
                                    timeout=(5, 305),
                                    stream=True)
                res.raise_for_status()
                out_path = self.make_work_file('out.pdf')
                with open(out_path, 'wb') as fh:
                    bytes_written = 0
                    for chunk in res.iter_content(chunk_size=None):
                        bytes_written += len(chunk)
                        fh.write(chunk)
                    if bytes_written > 100:
                        return out_path
            except RequestException as exc:
                if isinstance(exc, HTTPError):
                    if exc.response.status_code == 400:
                        raise ProcessingException(exc.response.text)
                log.error("Conversion failed: %s", exc)
                backoff(failures=attempt)
            finally:
                fh.close()
        raise ProcessingException("Document could not be converted to PDF.")
