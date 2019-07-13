import click
import logging
from servicelayer.cache import get_redis
from servicelayer.jobs import Job, JobStage as Stage
from servicelayer.archive.util import ensure_path

from ingestors.manager import Manager
from ingestors.directory import DirectoryIngestor
from ingestors.worker import IngestWorker

log = logging.getLogger(__name__)


@click.group()
def cli():
    logging.basicConfig(level=logging.DEBUG)


@cli.command()
@click.option('-s', '--sync', is_flag=True, default=False, help='Run without threads')  # noqa
def process(sync):
    """Start the queue and process tasks as they come. Blocks while waiting"""
    worker = IngestWorker(stages=[Stage.INGEST])
    if sync:
        worker.sync()
    else:
        worker.run()


@cli.command()
def killthekitten():
    """Completely kill redis contents."""
    conn = get_redis()
    conn.flushall()


@cli.command()
@click.option('--languages',
              multiple=True,
              help="language hint: 2-letter language code (ISO 639)")
@click.option('--dataset',
              required=True,
              help="foreign_id of the collection")
@click.argument('path', type=click.Path(exists=True))
def ingest(path, dataset, languages=None):
    """Queue a set of files for ingest."""
    context = {'languages': languages}
    conn = get_redis()
    job_id = Job.random_id()
    queue = Stage(conn, Stage.INGEST, job_id, dataset)
    manager = Manager(queue, context)
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


if __name__ == "__main__":
    cli()
