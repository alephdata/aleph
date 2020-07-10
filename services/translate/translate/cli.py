import click
import logging
from servicelayer.logs import configure_logging

from translate.worker import ServiceWorker, OP_TRANSLATE

log = logging.getLogger(__name__)


@click.group()
def cli():
    configure_logging()


@cli.command()
def worker():
    """Start the queue and process tasks as they come. Blocks while waiting"""
    worker = ServiceWorker(stages=[OP_TRANSLATE])
    worker.run()


if __name__ == "__main__":
    cli()
