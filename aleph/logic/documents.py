import os
import logging
from datetime import datetime

from servicelayer.reporting import Reporter
from servicelayer.jobs import Job

from aleph.core import db, archive, kv
from aleph.model import Document
from aleph.queues import ingest_entity, OP_CRAWL

log = logging.getLogger(__name__)


def crawl_directory(collection, path, parent=None, job=None, reporter=None):
    """Crawl the contents of the given path."""
    if job is None:
        job_id = 'crawl-directory-%s' % datetime.utcnow().timestamp()
        job = Job(kv, collection.foreign_id, job_id)

    if reporter is None:
        reporter = Reporter(stage=job.get_stage(OP_CRAWL))

    # FIXME
    start_at = datetime.utcnow()

    def start_report(entity):
        reporter.start(entity=entity.to_dict(), start_at=start_at, collection_id=collection.id)

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
        proxy = document.to_proxy()

        start_report(proxy)  # FIXME

        ingest_entity(collection, proxy, job_id=job.id)
        log.info("Crawl [%s]: %s -> %s", collection.id, path, document.id)
        if path.is_dir():
            for child in path.iterdir():
                crawl_directory(collection, child, document, job, reporter)

        reporter.end(entity=proxy.to_dict())
    except OSError as e:
        log.exception("Cannot crawl directory: %s", path)
        if parent:
            reporter.error(e, entity=parent.to_proxy().to_dict(), path=str(path))
