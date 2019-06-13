import logging
import requests
from normality import stringify
from pantomime.types import DEFAULT
from requests import RequestException, HTTPError
from abc import ABC, abstractmethod
from servicelayer import env
from servicelayer.cache import get_redis, make_key
from servicelayer.util import backoff, service_retries
from servicelayer.settings import REDIS_LONG

from ingestors.exc import ProcessingException
from ingestors.services.util import ShellCommand
from ingestors.util import join_path, make_directory

log = logging.getLogger(__name__)


class DocumentConverter(ABC):

    @classmethod
    def is_available(cls):
        return False

    def document_to_pdf(self, file_path, entity, work_path, archive):
        conn = get_redis()
        key = make_key('pdf', entity.get('contentHash'))
        if conn.exists(key):
            log.info("Using [%s] PDF from cache", entity.first('fileName'))
            pdf_hash = stringify(conn.get(key))
            entity.set('pdfHash', pdf_hash)
            if pdf_hash is not None:
                return archive.load_file(pdf_hash, temp_path=work_path)

        pdf_file = self._document_to_pdf(file_path, entity, work_path)
        if pdf_file is not None:
            content_hash = archive.archive_file(pdf_file)
            entity.set('pdfHash', content_hash)
            conn.set(key, content_hash, ex=REDIS_LONG)
            return pdf_file

    @abstractmethod
    def _document_to_pdf(self, file_path, entity, work_path):
        pass


class LocalDocumentConverter(DocumentConverter, ShellCommand):
    """Provides helpers for Libre/Open Office tools."""

    @classmethod
    def is_available(cls):
        return cls.find_command('soffice') is not None

    def _document_to_pdf(self, file_path, entity, work_path):
        """Converts an office document to PDF."""
        instance_dir = make_directory(work_path, 'soffice_instance')
        out_dir = make_directory(work_path, 'soffice_output')
        log.info('Converting [%s] to PDF...', entity.first('fileName'))
        instance_dir = '-env:UserInstallation=file://{}'.format(instance_dir)
        self.exec_command('soffice',
                          instance_dir,
                          '--nofirststartwizard',
                          '--norestore',
                          '--nologo',
                          '--nodefault',
                          '--nolockcheck',
                          '--invisible',
                          '--headless',
                          '--convert-to', 'pdf',
                          '--outdir', out_dir,
                          file_path)

        for out_file in out_dir.iterdir():
            return out_file

        msg = "Failed to convert to PDF: {}".format(file_path)
        raise ProcessingException(msg)


class ServiceDocumentConverter(DocumentConverter):
    """Provides helpers for UNO document conversion via HTTP."""
    SERVICE_URL = env.get('UNOSERVICE_URL')

    @classmethod
    def is_available(cls):
        return cls.SERVICE_URL is not None

    def _document_to_pdf(self, file_path, entity, work_path):
        """Converts an office document to PDF."""
        log.info('Converting [%s] to PDF...', entity.first('fileName'))
        out_path = file_path.name
        out_path = join_path(work_path, '%s.pdf' % out_path)
        file_name = entity.first('fileName') or 'data'
        mime_type = entity.first('mimeType') or DEFAULT
        attempt = 1
        for attempt in service_retries():
            fh = open(file_path, 'rb')
            try:
                files = {'file': (file_name, fh, mime_type)}
                res = requests.post(self.SERVICE_URL,
                                    files=files,
                                    timeout=(5, 305),
                                    stream=True)
                res.raise_for_status()
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
