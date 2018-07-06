import os
import logging
from tempfile import mkdtemp
from ingestors.util import remove_directory

from aleph.core import db, archive, celery
from aleph.model import Document, Events
from aleph.logic.notifications import publish
from aleph.logic.documents.manager import DocumentManager
from aleph.logic.documents.result import DocumentResult
from aleph.index.documents import index_document, index_records
from aleph.index.collections import index_collection
from aleph.analyze import analyze_document

log = logging.getLogger(__name__)


def get_manager():
    """Get an ingestor manager, as a singleton instance."""
    if not hasattr(DocumentManager, '_instance'):
        DocumentManager._instance = DocumentManager(archive)
        log.info("Loaded ingestors: %r", DocumentManager._instance.ingestors)
    return DocumentManager._instance


def process_document(document):
    """Perform post-ingest tasks like analysis and indexing."""
    analyze_document(document)
    index_document(document)
    index_records(document)
    if document.collection.casefile:
        index_collection(document.collection)


def ingest_document(document, file_path, role_id=None):
    """Given a stub document and file path, extract information.
    This does not attempt to infer metadata such as a file name."""
    document.status = Document.STATUS_PENDING
    if role_id is not None:
        document.uploader_id = role_id

    if file_path is not None and os.path.isfile(file_path):
        document.content_hash = archive.archive_file(file_path)

    db.session.commit()
    priority = 5 if document.collection.casefile else 3
    ingest.apply_async(args=[document.id], kwargs={'file_path': file_path}, priority=priority)


@celery.task()
def ingest(document_id, file_path=None, refresh=False):
    """Process a given document by extracting its contents.
    This may include creating or updating child documents."""
    document = Document.by_id(document_id)
    if document is None:
        log.error("Could not find document: %s", document_id)
        return

    # Work path will be used by storagelayer to cache a local
    # copy of data from an S3-based archive, and by ingestors
    # to perform processing and generate intermediary files.
    work_path = mkdtemp(prefix="aleph.ingest.")
    if file_path is None:
        file_path = archive.load_file(document.content_hash,
                                      file_name=document.safe_file_name,
                                      temp_path=work_path)

    try:
        manager = get_manager()
        result = DocumentResult(manager,
                                document,
                                file_path=file_path)
        get_manager().ingest(file_path,
                             result=result,
                             work_path=work_path)

        log.debug('Ingested [%s:%s]: %s',
                  document.id, document.schema, document.name)
        if document.collection.casefile and not refresh:
            params = {
                'collection': document.collection,
                'document': document
            }
            publish(Events.INGEST_DOCUMENT,
                    actor_id=document.uploader_id,
                    params=params)
        db.session.commit()
        process_document(document)
    except Exception:
        db.session.rollback()
        document = Document.by_id(document_id)
        log.exception("Ingest failed [%s]: %s", document.id, document.name)
    finally:
        # Removing the temp_path given to storagelayer makes it redundant
        # to also call cleanup on the archive.
        remove_directory(work_path)
