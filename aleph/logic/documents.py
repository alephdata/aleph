import os
import logging
from datetime import datetime

from aleph.core import db, archive
from aleph.logic.reports import get_reporter
from aleph.model import Document
from aleph.queues import ingest_entity, OP_CRAWL

log = logging.getLogger(__name__)


def crawl_directory(collection, path, parent=None, job_id=None, reporter=None):
    """Crawl the contents of the given path."""
    try:
        start_at = datetime.utcnow()
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
        proxy = document.to_proxy()

        if job_id is None:
            job_id = 'crawl-directory-%s' % datetime.utcnow().timestamp()

        if reporter is None:
            reporter = get_reporter(
                job=job_id,
                stage=OP_CRAWL,
                dataset=collection.foreign_id,
                ns=collection.ns,
            )

        reporter.start(entity=proxy, start_at=start_at)
        reporter.end(entity=proxy)

        ingest_entity(collection, proxy, job_id=job_id, reporter=reporter)
        log.info("Crawl [%s]: %s -> %s", collection.id, path, document.id)
        if path.is_dir():
            for child in path.iterdir():
                crawl_directory(collection, child, document, job_id, reporter)
    except OSError:
        log.exception("Cannot crawl directory: %s", path)
