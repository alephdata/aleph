import os
import logging

from aleph.core import db, archive
from aleph.model import Document
from aleph.queues import ingest_entity

log = logging.getLogger(__name__)


def crawl_directory(collection, path, parent=None):
    """Crawl the contents of the given path."""
    content_hash = None
    if path.is_file():
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
    ingest_entity(collection, document.to_proxy())
    log.info("Crawl [%s]: %s -> %s", collection.id, path, document.id)
    if path.is_dir():
        for child in path.iterdir():
            crawl_directory(collection, child, document)
