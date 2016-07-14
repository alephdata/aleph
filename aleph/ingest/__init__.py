import os
import logging
import requests

from aleph.core import db, get_archive, celery
from aleph.text import string_value
from aleph.ext import get_ingestors
from aleph.metadata import Metadata
from aleph.ingest.ingestor import Ingestor, IngestorException
from aleph.util import make_tempfile, remove_tempfile

log = logging.getLogger(__name__)

SKIP_ENTRIES = ['.git', '.hg', '.DS_Store', '.gitignore', 'Thumbs.db',
                '__MACOSX']


@celery.task()
def ingest_url(collection_id, metadata, url):
    meta = Metadata.from_data(metadata)
    tmp_path = make_tempfile(meta.file_name, suffix=meta.extension)
    try:
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
        Ingestor.dispatch(collection_id, meta)
    except Exception as ex:
        Ingestor.handle_exception(meta, collection_id, ex)
    finally:
        db.session.remove()
        remove_tempfile(tmp_path)


def ingest_directory(collection_id, meta, local_path, base_path=None,
                     move=False):
    """Ingest all the files in a directory."""
    # This is somewhat hacky, see issue #55 for the rationale.
    if not os.path.exists(local_path):
        log.error("Invalid path: %r", local_path)
        return

    base_path = base_path or local_path
    if not os.path.isdir(local_path):
        child = meta.make_child()
        child.source_path = base_path
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


def ingest_file(collection_id, meta, file_path, move=False):
    try:
        if not os.path.isfile(file_path):
            raise IngestorException("No such file: %r", file_path)
        if not meta.has('source_path'):
            meta.source_path = file_path
        meta = get_archive().archive_file(file_path, meta, move=move)
        ingest.delay(collection_id, meta.to_attr_dict())
    except Exception as ex:
        Ingestor.handle_exception(meta, collection_id, ex)
    finally:
        db.session.remove()


@celery.task()
def ingest(collection_id, metadata):
    meta = Metadata.from_data(metadata)
    Ingestor.dispatch(collection_id, meta)
