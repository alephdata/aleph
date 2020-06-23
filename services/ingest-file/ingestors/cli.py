import click
import logging
from pprint import pprint
from servicelayer.cache import get_redis, get_fakeredis
from servicelayer.logs import configure_logging
from servicelayer.jobs import Job, Dataset
from servicelayer.archive.util import ensure_path

from ingestors import settings
from ingestors.store import get_dataset
from ingestors.manager import Manager
from ingestors.directory import DirectoryIngestor
from ingestors.worker import IngestWorker, OP_ANALYZE, OP_INGEST

log = logging.getLogger(__name__)
STAGES = [OP_ANALYZE, OP_INGEST]


@click.group()
def cli():
    configure_logging()


@cli.command()
@click.option('-s', '--sync', is_flag=True, default=False, help='Run without threads')  # noqa
def process(sync):
    """Start the queue and process tasks as they come. Blocks while waiting"""
    worker = IngestWorker(stages=STAGES)
    if sync:
        worker.sync()
    else:
        worker.run()


@cli.command()
@click.argument('dataset')
def cancel(dataset):
    """Delete scheduled tasks for given dataset"""
    conn = get_redis()
    Dataset(conn, dataset).cancel()


@cli.command()
def killthekitten():
    """Completely kill redis contents."""
    conn = get_redis()
    conn.flushall()


def _ingest_path(db, conn, dataset, path, languages=[]):
    context = {'languages': languages}
    job = Job.create(conn, dataset)
    stage = job.get_stage(OP_INGEST)
    manager = Manager(db, stage, context)
    path = ensure_path(path)
    if path is not None:
        if path.is_file():
            entity = manager.make_entity('Document')
            checksum = manager.store(path)
            entity.set('contentHash', checksum)
            entity.make_id(checksum)
            entity.set('fileName', path.name)
            manager.queue_entity(entity)
        if path.is_dir():
            DirectoryIngestor.crawl(manager, path)
    manager.close()


@cli.command()
@click.option('--languages',
              multiple=True,
              help="3-letter language code (ISO 639)")
@click.option('--dataset',
              required=True,
              help="Name of the dataset")
@click.argument('path', type=click.Path(exists=True))
def ingest(path, dataset, languages=None):
    """Queue a set of files for ingest."""
    conn = get_redis()
    db = get_dataset(dataset, OP_INGEST)
    _ingest_path(db, conn, dataset, path, languages=languages)


@cli.command()
@click.option('--languages',
              multiple=True,
              help="3-letter language code (ISO 639)")
@click.option('--dataset',
              default='test',
              help="Name of the dataset")
@click.argument('path', type=click.Path(exists=True))
def debug(path, dataset, languages=None):
    """Debug the ingest for the given path."""
    conn = get_fakeredis()
    settings.sts.DATABASE_URI = 'sqlite://'
    db = get_dataset(dataset, OP_INGEST)
    _ingest_path(db, conn, dataset, path, languages=languages)
    worker = IngestWorker(conn=conn, stages=STAGES)
    worker.sync()
    for entity in db.iterate():
        pprint(entity.to_dict())


if __name__ == "__main__":
    cli()
