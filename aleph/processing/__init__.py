import logging

from archivekit.ingest import Ingestor

from aleph.core import archive, celery
from aleph.processing.pipeline import make_pipeline # noqa


log = logging.getLogger(__name__)


@celery.task()
def ingest_url(collection_name, url, package_id=None, meta={}):
    collection = archive.get(collection_name)
    meta['source_url'] = url
    log.info("Ingesting URL: %r to %r", url, collection)
    ingest(collection, url, package_id=package_id, meta=meta)


def ingest(collection, something, package_id=None, meta={}):
    for ingestor in Ingestor.analyze(something):
        try:
            if package_id is None:
                package_id = ingestor.hash()
            package = collection.get(package_id)
            package.ingest(ingestor, meta=meta)
            process_package.delay(collection.name, package.id)
        except Exception, e:
            log.exception(e)
        finally:
            ingestor.dispose()


@celery.task()
def process_collection(collection_name, overwrite=False):
    collection = archive.get(collection_name)
    for package in collection:
        process_package.delay(collection_name, package.id,
                              overwrite=overwrite)


@celery.task()
def process_package(collection_name, package_id, overwrite=False):
    collection = archive.get(collection_name)
    package = collection.get(package_id)
    if not package.exists():
        log.warn("Package doesn't exist: %r", package_id)
    log.info("Processing package: %r", package)
    pipeline = make_pipeline(collection, overwrite=overwrite)
    pipeline.process_package(package)


@celery.task()
def refresh_selectors(selectors):
    from aleph.processing.entities import refresh
    refresh(selectors)
