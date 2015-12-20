import os
import logging
import requests
from normality import slugify
from tempfile import mkstemp

from aleph.core import archive, celery
from aleph.model.metadata import Metadata
from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)

# dispatch
#   URLIngestor / URLCrawler
#   RarFileIngestor
#   ZipFileIngestor
#   OCRIngestor
#   PDFIngestor
#   WordIngestor
#   HTMLIngestor
#   TableIngestor


def meta_object(meta):
    if not isinstance(meta, Metadata):
        meta = Metadata(data=meta)
    return meta


@celery.task()
def ingest_url(source_id, meta, url):
    meta = meta_object(meta)
    fh, temp = mkstemp(suffix=slugify(url))
    os.close(fh)
    try:
        log.info("Ingesting URL: %r", url)
        res = requests.get(url, stream=True)
        with open(temp, 'wb') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
        meta.source_url = res.url
        meta.headers = res.headers
        ingest_file(source_id, meta, temp, move=True)
    except Exception as ex:
        log.exception(ex)
    finally:
        if os.path.isfile(temp):
            os.unlink(temp)


def ingest_file(source_id, meta, file_name, move=False):
    meta = meta_object(meta)
    if not os.path.isfile(file_name):
        raise ValueError("No such file: %r", file_name)
    if not meta.title:
        meta.title = os.path.basename(file_name)
    if not meta.source_path:
        meta.source_path = file_name
    meta = archive.archive_file(file_name, meta, move=move)
    ingest.delay(source_id, meta)


@celery.task()
def ingest(source_id, meta):
    meta = meta_object(meta)
    try:
        Ingestor.dispatch(source_id, meta)
    except Exception as ex:
        log.exception(ex)
