import os
import logging
import requests
from tempfile import mkstemp

from aleph.core import get_archive, celery
from aleph.metadata import Metadata
from aleph.ingest.ingestor import Ingestor, IngestorException

log = logging.getLogger(__name__)

# https://bugzilla.redhat.com/show_bug.cgi?id=191060#c1
# https://github.com/deanmalmgren/textract/blob/master/textract/parsers/pptx_parser.py
# https://github.com/chardet/chardet
# http://poppler.freedesktop.org/
# http://www.unixuser.org/~euske/python/pdfminer/index.html
# https://mstamy2.github.io/PyPDF2/#documentation
# http://pybrary.net/pyPdf/pythondoc-pyPdf.pdf.html
# https://svn.apache.org/viewvc/httpd/httpd/branches/2.2.x/docs/conf/mime.types?view=annotate

# pdfminer.six: https://github.com/goulu/pdfminer
# tesserocr: https://github.com/sirfz/tesserocr


@celery.task()
def ingest_url(source_id, metadata, url):
    meta = Metadata(data=metadata)
    try:
        fh, tmp_path = mkstemp()
        os.close(fh)
        log.info("Ingesting URL: %r", url)
        res = requests.get(url, stream=True, timeout=120)
        if res.status_code >= 400:
            msg = "HTTP Error %r: %r" % (url, res.status_code)
            raise IngestorException(msg)
        with open(tmp_path, 'w') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
        if not meta.has('source_url'):
            meta.source_url = res.url
        meta.headers = res.headers
        meta = get_archive().archive_file(tmp_path, meta, move=True)
        Ingestor.dispatch(source_id, meta)
    except Exception as ex:
        Ingestor.handle_exception(meta, source_id, ex)


def ingest_file(source_id, meta, file_path, move=False):
    try:
        if not os.path.isfile(file_path):
            raise IngestorException("No such file: %r", file_path)
        if not meta.has('source_path'):
            meta.source_path = file_path
        meta = get_archive().archive_file(file_path, meta, move=move)
        ingest.delay(source_id, meta.data)
    except Exception as ex:
        Ingestor.handle_exception(meta, source_id, ex)


@celery.task()
def ingest(source_id, metadata):
    meta = Metadata(data=metadata)
    Ingestor.dispatch(source_id, meta)
