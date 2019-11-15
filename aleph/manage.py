# coding: utf-8
import json
import click
import logging
from pathlib import Path
from pprint import pprint  # noqa
from itertools import count
from banal import ensure_list
from normality import slugify
from tabulate import tabulate
from flask.cli import FlaskGroup
from servicelayer.jobs import Job
from followthemoney.cli.util import load_mapping_file

from aleph.core import create_app, db, cache
from aleph.authz import Authz
from aleph.model import Collection, Role
from aleph.migration import upgrade_system, destroy_db, cleanup_deleted
from aleph.worker import get_worker
from aleph.queues import get_status, queue_task, cancel_queue
from aleph.queues import get_active_collection_status, get_stage
from aleph.queues import OP_BULKLOAD, OP_PROCESS, OP_XREF
from aleph.index.admin import delete_index
from aleph.logic.collections import create_collection, update_collection
from aleph.logic.collections import reset_collection, delete_collection
from aleph.logic.collections import index_collections
from aleph.logic.processing import index_aggregate, process_collection
from aleph.logic.processing import bulk_write
from aleph.logic.documents import crawl_directory
from aleph.logic.roles import update_role, update_roles
from aleph.logic.rdf import export_collection
from aleph.logic.permissions import update_permission


log = logging.getLogger('aleph')


def get_collection(foreign_id):
    collection = Collection.by_foreign_id(foreign_id, deleted=True)
    if collection is None:
        raise click.BadParameter("No such collection: %r" % foreign_id)
    return collection


def ensure_collection(foreign_id, label):
    authz = Authz.from_role(Role.load_cli_user())
    config = {
        'foreign_id': foreign_id,
        'label': label,
        'casefile': False
    }
    create_collection(config, authz)
    return Collection.by_foreign_id(foreign_id)


@click.group(cls=FlaskGroup, create_app=create_app)
def cli():
    """Server-side command line for aleph."""


@cli.command()
def collections():
    """List all collections."""
    collections = []
    for coll in Collection.all():
        collections.append((coll.foreign_id, coll.id, coll.label))
    print(tabulate(collections, headers=['Foreign ID', 'ID', 'Label']))


@cli.command()
@click.option('-s', '--sync', is_flag=True, default=False, help='Run without threads and quit when no tasks are left.')  # noqa
def worker(sync=False):
    """Run the queue-based worker service."""
    worker = get_worker()
    if sync:
        worker.sync()
    else:
        worker.run()


@cli.command()
@click.argument('path', type=click.Path(exists=True))
@click.option('-l', '--language', multiple=True, help='ISO language codes for OCR')  # noqa
@click.option('-f', '--foreign_id', help='Foreign ID of the collection')
def crawldir(path, language=None, foreign_id=None):
    """Crawl the given directory."""
    path = Path(path)
    if foreign_id is None:
        foreign_id = 'directory:%s' % slugify(path)
    collection = ensure_collection(foreign_id, path.name)
    log.info('Crawling %s to %s (%s)...', path, foreign_id, collection.id)
    crawl_directory(collection, path)
    log.info('Complete. Make sure a worker is running :)')
    update_collection(collection)


@cli.command()
@click.argument('foreign_id')
@click.option('-k', '--keep-metadata', is_flag=True, default=False)
def delete(foreign_id, keep_metadata=False):
    """Delete all the contents for a given collecton."""
    collection = get_collection(foreign_id)
    delete_collection(collection, keep_metadata=keep_metadata)


@cli.command()
@click.argument('foreign_id')
@click.option('--sync', is_flag=True, default=False)
def reset(foreign_id, sync=False):
    """Clear the search index and entity cache or a collection."""
    collection = get_collection(foreign_id)
    reset_collection(collection, sync=False)


@cli.command()
@click.argument('foreign_id')
def reindex(foreign_id):
    """Clear the search index and entity cache or a collection."""
    collection = get_collection(foreign_id)
    stage = get_stage(collection, OP_PROCESS)
    index_aggregate(stage, collection)
    update_collection(collection)


@cli.command()
@click.argument('foreign_id')
@click.option('--sync', is_flag=True, default=False)
def process(foreign_id, sync=False):
    """Process documents and database entities and index them."""
    collection = get_collection(foreign_id)
    stage = get_stage(collection, OP_PROCESS)
    process_collection(stage, collection, sync=sync)


@cli.command()
def flushdeleted():
    """Remove soft-deleted database objects."""
    cleanup_deleted()


@cli.command()
def update(index=False, process=False, reset=False):
    """Re-index all the collections and clear some caches."""
    update_roles()
    index_collections(refresh=True)


@cli.command()
@click.argument('foreign_id')
@click.option('-a', '--against', multiple=True, help='foreign IDs of collections to xref against')  # noqa
def xref(foreign_id, against=None):
    """Cross-reference all entities and documents in a collection."""
    collection = get_collection(foreign_id)
    against = [get_collection(c).id for c in ensure_list(against)]
    against = {'against_collection_ids': against}
    queue_task(collection, OP_XREF, payload=against)


@cli.command()
@click.argument('file_name')
def bulkload(file_name):
    """Load entities from the specified mapping file."""
    log.info("Mapping bulk data from: %s", file_name)
    config = load_mapping_file(file_name)
    for foreign_id, data in config.items():
        data['foreign_id'] = foreign_id
        data['label'] = data.get('label', foreign_id)
        create_collection(data)
        collection = Collection.by_foreign_id(foreign_id)
        queue_task(collection, OP_BULKLOAD, payload=data)


@cli.command('load-entities')
@click.argument('foreign_id')
@click.option('-i', '--infile', type=click.File('r'), default='-')  # noqa
@click.option('--unsafe', is_flag=True, default=False, help='Allow loading references to archive hashes.')  # noqa
def load_entities(foreign_id, infile, unsafe=False):
    """Load FtM entities from the specified iJSON file."""
    collection = ensure_collection(foreign_id, foreign_id)

    def read_entities():
        for idx in count(1):
            line = infile.readline()
            if not line:
                return
            if idx % 1000 == 0:
                log.info("[%s] Loaded %s entities from: %s",
                         foreign_id, idx, infile.name)
            yield json.loads(line)

    job_id = Job.random_id()
    log.info("Loading [%s]: %s", job_id, foreign_id)
    bulk_write(collection, read_entities(), job_id=job_id, unsafe=unsafe)
    update_collection(collection)


@cli.command('dump-rdf')
@click.argument('foreign_id')
@click.option('-o', '--outfile', type=click.File('wb'), default='-')  # noqa
def dump_rdf(foreign_id, outfile):
    """Generate a RDF triples for the given collection."""
    collection = get_collection(foreign_id)
    for line in export_collection(collection):
        outfile.write(line)


@cli.command()
@click.argument('foreign_id', required=False)
def status(foreign_id=None):
    """Get the queue status (pending and finished tasks.)"""
    if foreign_id is not None:
        collection = get_collection(foreign_id)
        status = get_status(collection)
    else:
        status = get_active_collection_status()
    pprint(status)


@cli.command()
@click.argument('foreign_id')
def cancel(foreign_id):
    """Cancel all queued tasks for the dataset."""
    collection = get_collection(foreign_id)
    cancel_queue(collection)
    update_collection(collection)


@cli.command()
@click.argument('foreign_id')
@click.option('-n', '--name')
@click.option('-e', '--email')
@click.option('-i', '--is_admin')
@click.option('-p', '--password')
def createuser(foreign_id, password=None, name=None, email=None, is_admin=False):  # noqa
    """Create a user and show their API key."""
    role = Role.load_or_create(foreign_id, Role.USER,
                               name or foreign_id,
                               email=email or "user@example.com",
                               is_admin=is_admin)
    if password is not None:
        role.set_password(password)
    db.session.add(role)
    db.session.commit()
    update_role(role)
    return role.api_key


@cli.command()
@click.argument('foreign_id')
def publish(foreign_id):
    """Make a collection visible to all users."""
    collection = get_collection(foreign_id)
    role = Role.by_foreign_id(Role.SYSTEM_GUEST)
    editor = Role.load_cli_user()
    update_permission(role, collection, True, False, editor_id=editor.id)
    update_collection(collection)


@cli.command()
def upgrade():
    """Create or upgrade the search index and database."""
    upgrade_system()


@cli.command()
def resetindex():
    """Re-create the ES index configuration, dropping all data."""
    delete_index()
    upgrade()


@cli.command()
def resetcache():
    """Clear the redis cache."""
    cache.flush()


@cli.command()
def evilshit():
    """EVIL: Delete all data and recreate the database."""
    delete_index()
    destroy_db()
    upgrade()
