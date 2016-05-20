import os
import logging
import shutil
import subprocess
from tempfile import mkdtemp

from aleph.core import get_config
from aleph.ingest.ingestor import IngestorException
from aleph.ingest.text import TextIngestor

log = logging.getLogger(__name__)


class DocumentIngestor(TextIngestor):
    MIME_TYPES = ['application/msword', 'application/rtf', 'application/x-rtf',
                  'application/vnd.oasis.opendocument.text',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # noqa
                  'text/richtext', 'application/wordperfect', 'application/vnd.wordperfect']  # noqa
    EXTENSIONS = ['doc', 'docx', 'rtf', 'odt', 'sxw', 'dot', 'docm', 'hqx',
                  'pdb', 'txt', 'wpd']
    BASE_SCORE = 5

    def generate_pdf_alternative(self, meta, local_path):
        """Convert LibreOffice-supported documents to PDF."""
        work_dir = mkdtemp()
        instance_dir = mkdtemp()
        try:
            soffice = get_config('SOFFICE_BIN')
            instance_path = '"-env:UserInstallation=file://%s"' % instance_dir
            args = [soffice, '--convert-to', 'pdf', '--nofirststartwizard',
                    instance_path, '--norestore', '--nologo', '--nodefault',
                    '--nolockcheck', '--invisible', '--outdir', work_dir,
                    '--headless', local_path]
            log.debug('Converting document: %r', ' '.join(args))
            subprocess.call(args)
            for out_file in os.listdir(work_dir):
                return os.path.join(work_dir, out_file)
        finally:
            shutil.rmtree(instance_dir)

    def extract_pdf_alternative(self, meta, pdf_path):
        try:
            self.store_pdf(meta, pdf_path)
            self.extract_pdf(meta, pdf_path)
        finally:
            if pdf_path is not None and os.path.isfile(pdf_path):
                os.unlink(pdf_path)

    def ingest(self, meta, local_path):
        pdf_path = self.generate_pdf_alternative(meta, local_path)
        if pdf_path is None or not os.path.isfile(pdf_path):
            raise IngestorException("Could not convert document: %r" % meta)
        self.extract_pdf_alternative(meta, pdf_path)


class PresentationIngestor(DocumentIngestor):
    MIME_TYPES = ['application/vnd.ms-powerpoint.presentation',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',  # noqa
                  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',  # noqa
                  'application/vnd.oasis.opendocument.presentation',
                  'application/vnd.sun.xml.impress']
    EXTENSIONS = ['ppt', 'pptx', 'odp', 'pot', 'pps', 'ppa']
    BASE_SCORE = 5
