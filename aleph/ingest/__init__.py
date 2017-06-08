import os
import logging
import requests

from aleph.core import db, archive, celery
from aleph.core import WORKER_QUEUE, WORKER_ROUTING_KEY
from aleph.text import string_value
from aleph.ext import get_ingestors
from aleph.metadata import Metadata
from aleph.ingest.ingestor import Ingestor, IngestorException
from aleph.util import make_tempfile, remove_tempfile

log = logging.getLogger(__name__)

SKIP_ENTRIES = ['.git', '.hg', '.DS_Store', '.gitignore', 'Thumbs.db',
                '__MACOSX']


@celery.task(bind=True, max_retries=3)
def ingest_url(self, document_id, url):
    meta = Metadata.from_data(metadata)
    if meta.foreign_id is None:
        meta.foreign_id = url
    tmp_path = make_tempfile(meta.file_name, suffix=meta.extension)
    try:
        log.info("Ingesting URL: %s", url)
        res = requests.get(url, stream=True)
        if res.status_code == 404:
            log.info("HTTP not found: %s", url)
            return
        if res.status_code >= 399:
            countdown = 3600 ** self.request.retries
            self.retry(countdown=countdown)
        with open(tmp_path, 'w') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
        if not meta.has('source_url'):
            meta.source_url = res.url
        meta.headers = res.headers
        meta = archive.archive_file(tmp_path, meta, move=True)
        Ingestor.dispatch(collection_id, meta)
    except IOError as ioe:
        log.info("IO Failure: %r", ioe)
        countdown = 3600 ** self.request.retries
        self.retry(countdown=countdown)
    except Exception as ex:
        Ingestor.handle_exception(meta, collection_id, ex)
    finally:
        db.session.remove()
        remove_tempfile(tmp_path)


def ingest_path(collection_id, file_path, meta=None):
    pass


@celery.task()
def ingest(document_id):
    meta = Metadata.from_data(metadata)
    Ingestor.dispatch(collection_id, meta)


def reingest_collection(collection):
    for document in collection.documents:
        ingest.delay(document.id)
