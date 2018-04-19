import logging
from ingestors.util import is_file

from aleph.core import db, archive, celery
from aleph.model import Document, Events
from aleph.index.collections import index_collection
from aleph.ingest.manager import DocumentManager
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def get_manager():
    """Get an ingestor manager, as a singleton instance."""
    if not hasattr(DocumentManager, '_instance'):
        DocumentManager._instance = DocumentManager(archive)
        log.info("Loaded ingestors: %r", DocumentManager._instance.ingestors)
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
        priority = 5 if document.collection.casefile else 3
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

    if document.collection.casefile:
        index_collection(document.collection)
        params = {
            'document': document,
            'collection': document.collection
        }
        publish(Events.INGEST_DOCUMENT,
                actor_id=role_id,
                params=params)
