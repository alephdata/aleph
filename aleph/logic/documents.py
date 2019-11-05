import os
import logging
from servicelayer.jobs import Job

from aleph.core import db, archive
from aleph.model import Document
from aleph.queues import ingest_entity

log = logging.getLogger(__name__)


def crawl_directory(collection, path, parent=None, job_id=None):
    """Crawl the contents of the given path."""
    try:
        content_hash = None
        if not path.is_dir():
            content_hash = archive.archive_file(path)
        foreign_id = path.name
        if parent is not None:
            foreign_id = os.path.join(parent.foreign_id, foreign_id)
        meta = {'file_name': path.name}
        document = Document.save(collection,
                                 parent=parent,
                                 foreign_id=foreign_id,
                                 content_hash=content_hash,
                                 meta=meta)
        db.session.commit()
        job_id = job_id or Job.random_id()
        ingest_entity(collection, document.to_proxy(), job_id=job_id)
        log.info("Crawl [%s]: %s -> %s", collection.id, path, document.id)
        if path.is_dir():
            for child in path.iterdir():
                crawl_directory(collection, child, document, job_id)
    except OSError:
        log.exception("Cannot crawl directory: %s", path)
