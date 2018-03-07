import logging
from ingestors.util import is_file

from aleph.core import db, archive, celery
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


def ingest_document(document, file_path, role_id=None, shallow=False):
    """Given a stub document and file path, extract information.
    This does not attempt to infer metadata such as a file name."""
    document.status = Document.STATUS_PENDING
    if not is_file(file_path):
        manager = get_manager()
        manager.ingest_document(document,
                                file_path=file_path,
                                role_id=role_id,
                                shallow=shallow)
    else:
        document.content_hash = archive.archive_file(file_path)
        db.session.commit()
        priority = 3 if document.collection.managed else 5
        ingest.apply_async(args=[document.id],
                           kwargs={'role_id': role_id},
                           priority=priority)


@celery.task()
def ingest(document_id, role_id=None):
    """Process a given document by extracting its contents.
    This may include creating or updating child documents."""
    document = Document.by_id(document_id)
    if document is None:
        log.error("Could not find document: %s", document_id)
        return

    get_manager().ingest_document(document, role_id=role_id)

    # is this too often?
    from aleph.logic.collections import update_collection
    update_collection(document.collection)

    pending = Document.pending_count(collection_id=document.collection.id)
    if pending == 0:
        ingest_complete(document.collection, role_id=role_id)


def ingest_complete(collection, role_id=None):
    """Operations supposed to be performed when an ingest process completes."""
    from aleph.logic.collections import collection_url  # noqa
    role = Role.by_id(role_id)
    if role is not None and not collection.managed:
        # notify the user that their import is completed.
        notify_role_template(role,
                             collection.label,
                             'email/ingest.html',
                             collection=collection,
                             url=collection_url(collection.id))
