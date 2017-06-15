import os
import six
import logging
import requests
from flask import current_app

from aleph.core import db, archive, celery, app_url
from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.core import WORKER_QUEUE, WORKER_ROUTING_KEY
from aleph.model import Document, Role
from aleph.ingest.manager import DocumentManager
from aleph.util import make_tempfile, remove_tempfile
from aleph.notify import notify_role_template

log = logging.getLogger(__name__)


def get_manager():
    """Get an ingestor manager, as a singleton instance."""
    if not hasattr(DocumentManager, '_instance'):
        DocumentManager._instance = DocumentManager(current_app.config,
                                                    archive)
        log.info("Loaded ingestors: %r", DocumentManager._instance.ingestors)
    return DocumentManager._instance


@celery.task(bind=True, max_retries=3)
def ingest_url(self, document_id, url):
    """Load the given URL into the document specified by document_id."""
    document = Document.by_id(document_id)
    if document is None:
        log.error("Could not find document: %s", document_id)
        return

    tmp_path = make_tempfile(document.file_name, suffix=document.extension)
    try:
        log.info("Ingesting URL: %s", url)
        res = requests.get(url, stream=True)
        if res.status_code >= 500:
            countdown = 3600 ** self.request.retries
            self.retry(countdown=countdown)
            return
        if res.status_code >= 400:
            document.status = Document.STATUS_FAIL
            document.error_message = "HTTP %s: %s" % (res.status_code, url)
            db.session.commit()
            return
        with open(tmp_path, 'w') as fh:
            for chunk in res.iter_content(chunk_size=1024):
                if chunk:
                    fh.write(chunk)
        if not document.has_meta('source_url'):
            document.source_url = res.url
        if document.foreign_id:
            document.foreign_id = res.url
        document.headers = res.headers
        document.content_hash = archive.archive_file(tmp_path)
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


def ingest_document(document, file_path, role_id=None):
    """Given a stub document and file path, extract information.
    This does not attempt to infer metadata such as a file name."""
    document.status = Document.STATUS_PENDING
    if os.path.isdir(file_path):
        manager = get_manager()
        manager.ingest_document(document, file_path=file_path, role_id=role_id)
    else:
        ch = archive.archive_file(file_path,
                                  content_hash=document.content_hash)
        document.content_hash = ch or document.content_hash
        db.session.commit()
        if role_id is not None:
            queue = USER_QUEUE
            routing_key = USER_ROUTING_KEY
        else:
            queue = WORKER_QUEUE
            routing_key = WORKER_ROUTING_KEY
        ingest.apply_async(args=[document.id],
                           kwargs=dict(role_id=role_id),
                           queue=queue,
                           routing_key=routing_key)


@celery.task()
def ingest(document_id, role_id=None):
    """Process a given document by extracting its contents.
    This may include creating or updating child documents."""
    document = Document.by_id(document_id)
    if document is None:
        log.error("Could not find document: %s", document_id)
        return

    get_manager().ingest_document(document, role_id=role_id)

    pending = Document.pending_count(collection_id=document.collection.id)
    if pending == 0:
        ingest_complete(document.collection, role_id=role_id)


def ingest_complete(collection, role_id=None):
    """Operations supposed to be performed when an ingest process completes."""
    from aleph.logic.collections import update_collection  # noqa
    update_collection(collection)
    role = Role.by_id(role_id)
    if role is not None:
        # notify the user that their import is completed.
        url = '%scollections/%s' % (app_url, collection.id)
        notify_role_template(role, collection.label, 'email/ingest.html',
                             collection=collection, url=url)
