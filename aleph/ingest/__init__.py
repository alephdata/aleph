import logging
from ingestors.util import is_file

from aleph.core import db, archive, celery
from aleph.core import USER_QUEUE, USER_ROUTING_KEY
from aleph.core import WORKER_QUEUE, WORKER_ROUTING_KEY
from aleph.model import Document, Events
from aleph.ingest.manager import DocumentManager

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
        managed = document.collection.managed
        queue = USER_QUEUE if managed else WORKER_QUEUE
        routing_key = USER_ROUTING_KEY if managed else WORKER_ROUTING_KEY
        ingest.apply_async(args=[document.id],
                           kwargs={'role_id': role_id},
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

    from aleph.logic.collections import update_collection
    update_collection(document.collection)

    from aleph.logic.notifications import publish
    params = {
        'document': document,
        'collection': document.collection
    }
    publish(Events.INGEST_DOCUMENT,
            actor_id=role_id,
            params=params)
