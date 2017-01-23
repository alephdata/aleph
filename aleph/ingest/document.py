import os
import six
import shutil
import logging
import subprocess32 as subprocess
from tempfile import mkdtemp
from chardet.universaldetector import UniversalDetector

from aleph.core import get_config
from aleph.ingest.ingestor import IngestorException
from aleph.ingest.text import TextIngestor
from aleph.text import string_value

log = logging.getLogger(__name__)

CONVERT_TIMEOUT = 5 * 60


class DocumentIngestor(TextIngestor):
    MIME_TYPES = ['application/msword', 'application/rtf', 'application/x-rtf',
                  'application/vnd.oasis.opendocument.text',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # noqa
                  'text/richtext', 'application/wordperfect', 'application/vnd.wordperfect']  # noqa
    EXTENSIONS = ['doc', 'docx', 'rtf', 'odt', 'sxw', 'dot', 'docm', 'hqx',
                  'pdb', 'wpd']
    BASE_SCORE = 5

    def generate_pdf_alternative(self, meta, local_path):
        """Convert LibreOffice-supported documents to PDF."""
        work_dir = six.text_type(mkdtemp())
        instance_dir = six.text_type(mkdtemp())
        try:
            soffice = get_config('SOFFICE_BIN')
            instance_path = u'"-env:UserInstallation=file://%s"' % instance_dir
            args = [soffice, '--convert-to', 'pdf', '--nofirststartwizard',
                    instance_path, '--norestore', '--nologo', '--nodefault',
                    '--nolockcheck', '--invisible', '--outdir', work_dir,
                    '--headless', string_value(local_path)]
            # log.debug('Converting document: %r', ' '.join(args))
            subprocess.call(args, timeout=CONVERT_TIMEOUT)
            for out_file in os.listdir(work_dir):
                return os.path.join(work_dir, out_file)
            raise IngestorException("Could not convert document: %r" % meta)
        finally:
            shutil.rmtree(instance_dir)

    def extract_pdf_alternative(self, meta, pdf_path):
        try:
            self.store_pdf(meta, pdf_path)
            self.extract_pdf(meta, pdf_path)
        finally:
            if os.path.isfile(pdf_path):
                os.unlink(pdf_path)

    def ingest(self, meta, local_path):
        pdf_path = self.generate_pdf_alternative(meta, local_path)
        if pdf_path is not None:
            self.extract_pdf_alternative(meta, pdf_path)


class PlainTextIngestor(DocumentIngestor):
    SKIP_STRINGS = ['<?xml', '<!doctype', '<html']
    MIME_TYPES = ['text/plain']  # noqa
    EXTENSIONS = ['txt']
    BASE_SCORE = 1

    @classmethod
    def match(cls, meta, local_path):
        # try to determine if a file is binary.
        detector = UniversalDetector()
        text = []
        with open(local_path, 'rb') as fh:
            while len(text) < 20:
                data = fh.read(1024)
                if '\x00' in data or '\xff' in data:
                    return -1
                detector.feed(data)
                text.append(data)
                if detector.done:
                    break
        detector.close()
        enc = detector.result
        if enc.get('encoding') is None or enc.get('confidence') < 0.5:
            return -1
        text = ''.join(text)
        try:
            text = text.decode(enc.get('encoding'))
        except:
            # FIXME: if the last read byte is partial, this will fail
            return -1
        for skip in cls.SKIP_STRINGS:
            if skip in text.lower():
                return -1
        return 1


class PresentationIngestor(DocumentIngestor):
    MIME_TYPES = ['application/vnd.ms-powerpoint.presentation',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',  # noqa
                  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',  # noqa
                  'application/vnd.oasis.opendocument.presentation',
                  'application/vnd.sun.xml.impress']
    EXTENSIONS = ['ppt', 'pptx', 'odp', 'pot', 'pps', 'ppa']
    BASE_SCORE = 5
