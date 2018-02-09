import logging
from ingestors.util import is_file

from aleph.core import db, archive, celery
from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.core import WORKER_QUEUE, WORKER_ROUTING_KEY
from aleph.model import Document, Role
from aleph.ingest.manager import DocumentManager
from aleph.notify import notify_role_template

log = logging.getLogger(__name__)


def get_manager():
    """Get an ingestor manager, as a singleton instance."""
    if not hasattr(DocumentManager, '_instance'):
        DocumentManager._instance = DocumentManager(archive)
        # log.info("Loaded ingestors: %r", DocumentManager._instance.ingestors)
    return DocumentManager._instance


def ingest_document(document, file_path, role_id=None):
    """Given a stub document and file path, extract information.
    This does not attempt to infer metadata such as a file name."""
    document.status = Document.STATUS_PENDING
    if not is_file(file_path):
        manager = get_manager()
        manager.ingest_document(document,
                                file_path=file_path,
                                role_id=role_id)
    else:
        document.content_hash = archive.archive_file(file_path)
        db.session.commit()
        managed = document.collection.managed
        queue = USER_QUEUE if managed else WORKER_QUEUE
        routing_key = USER_ROUTING_KEY if managed else WORKER_ROUTING_KEY
        ingest.apply_async(args=[document.id],
                           kwargs={'role_id': role_id},
                           queue=queue,
                           routing_key=routing_key)
    db.session.expunge(document)


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
    from aleph.logic.collections import update_collection, collection_url  # noqa
    update_collection(collection)
    role = Role.by_id(role_id)
    if role is not None and not collection.managed:
        # notify the user that their import is completed.
        notify_role_template(role,
                             collection.label,
                             'email/ingest.html',
                             collection=collection,
                             url=collection_url(collection.id))
