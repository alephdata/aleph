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
def ingest_url(self, collection_id, metadata, url):
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


def ingest_directory(collection_id, meta, local_path, base_path=None,
                     move=False):
    """Ingest all the files in a directory."""
    local_path = string_value(local_path)

    # This is somewhat hacky, see issue #55 for the rationale.
    if not os.path.exists(local_path):
        log.error("Invalid path: %r", local_path)
        return

    base_path = string_value(base_path) or local_path
    if not os.path.isdir(local_path):
        child = meta.make_child()
        child.source_path = base_path
        child.foreign_id = base_path
        return ingest_file(collection_id, child, local_path, move=move)

    # handle bundles
    claimed = []
    for cls in get_ingestors():
        if not hasattr(cls, 'bundle'):
            continue
        bundler = cls(collection_id)
        claimed.extend(bundler.bundle(meta, local_path))

    # recurse downward into the directory:
    for entry in os.listdir(local_path):
        entry_path = os.path.join(local_path, string_value(entry))
        entry_base = os.path.join(base_path, string_value(entry))
        if entry in SKIP_ENTRIES or entry in claimed:
            log.debug("Ignore: %r", entry_base)
            continue
        log.info("Handle [%s]: %s", meta.crawler_run, entry_base)
        # We don't care if it is a file, this is handled at
        # the beginning anyway.
        ingest_directory(collection_id, meta, entry_path,
                         base_path=entry_base, move=move)


def ingest_file(collection_id, meta, file_path, move=False,
                queue=WORKER_QUEUE, routing_key=WORKER_ROUTING_KEY):
    # the queue and routing key arguments are a workaround to
    # expedite user uploads over long-running batch imports.
    file_path = string_value(file_path)
    try:
        if not os.path.isfile(file_path):
            raise IngestorException("No such file: %r", file_path)
        if not meta.has('source_path'):
            meta.source_path = file_path
        meta = archive.archive_file(file_path, meta, move=move)
        ingest.apply_async([collection_id, meta.to_attr_dict()],
                           queue=queue, routing_key=routing_key)
    except Exception as ex:
        Ingestor.handle_exception(meta, collection_id, ex)
    finally:
        db.session.remove()


@celery.task()
def ingest(collection_id, metadata):
    meta = Metadata.from_data(metadata)
    Ingestor.dispatch(collection_id, meta)


def reingest_collection(collection):
    for document in collection.documents:
        ingest.delay(collection.id, document.meta.to_attr_dict())
