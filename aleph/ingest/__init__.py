import six
import logging
import requests
from flask import current_app

from aleph.core import db, archive, celery
# from aleph.core import WORKER_QUEUE, WORKER_ROUTING_KEY
from aleph.model import Document
from aleph.ingest.manager import DocumentManager
from aleph.util import make_tempfile, remove_tempfile

log = logging.getLogger(__name__)

# TODO: cache
# TODO: queues


def get_manager():
    """Get an ingestor manager, as a singleton instance."""
    if not hasattr(DocumentManager, '_instance'):
        DocumentManager._instance = DocumentManager(current_app.config,
                                                    archive)
    return DocumentManager._instance


@celery.task(bind=True, max_retries=3)
def ingest_url(self, document_id, url):
    """Load the given URL into the document specified by document_id."""
    document = Document.by_id(document_id)
    if document is None:
        log.error("Could not find document: %s", document_id)
        return
    meta = document.meta
    tmp_path = make_tempfile(meta.file_name, suffix=meta.extension)
    try:
        log.info("Ingesting URL: %s", url)
        res = requests.get(url, stream=True)
        if res.status_code >= 500:
            countdown = 3600 ** self.request.retries
            self.retry(countdown=countdown)
        if res.status_code >= 400:
            document.status = Document.STATUS_FAIL
            document.error_message = "HTTP not found: %s", url
            db.session.commit()
            return
        with open(tmp_path, 'w') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
        if not meta.has('source_url'):
            meta.source_url = res.url
        if not meta.has('foreign_id'):
            meta.foreign_id = res.url
        meta.headers = res.headers
        meta.content_hash = archive.archive_file(tmp_path)
        document.meta = meta
        db.session.commit()
        get_manager().ingest_document(document)
    except IOError as ioe:
        log.info("IO Failure: %r", ioe)
        countdown = 3600 ** self.request.retries
        self.retry(countdown=countdown)
    except Exception as ex:
        document.status = Document.STATUS_FAIL
        document.error_type = type(ex).__name__
        document.error_message = six.text_type(ex)
        db.session.commit()
        log.exception(ex)
    finally:
        db.session.remove()
        remove_tempfile(tmp_path)


def ingest_path(collection_id, file_path, id=None, meta=None):
    get_manager().handle_child(parent=None,
                               collection_id=collection_id,
                               file_path=file_path,
                               meta=meta,
                               id=id)


@celery.task()
def ingest(document_id):
    """Process a given document by extracting its contents.
    This may include creating or updating child documents."""
    document = Document.by_id(document_id)
    if document is None:
        log.error("Could not find document: %s", document_id)
        return

    get_manager().ingest_document(document)


def reingest_collection(collection):
    for document in collection.documents:
        ingest.delay(document.id)
