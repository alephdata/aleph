# coding: utf-8
import json
import click
import logging
import random
from pathlib import Path
from pprint import pprint  # noqa
from itertools import count
from normality import slugify
from tabulate import tabulate
from flask.cli import FlaskGroup
from followthemoney.cli.util import write_object

from aleph.core import create_app, cache
from aleph.authz import Authz
from aleph.model import Collection, Role
from aleph.migration import upgrade_system, destroy_db, cleanup_deleted
from aleph.worker import get_worker
from aleph.queues import get_status, get_stage, cancel_queue
from aleph.queues import get_active_dataset_status, OP_XREF
from aleph.index.admin import delete_index
from aleph.index.entities import iter_proxies
from aleph.logic.collections import create_collection, update_collection
from aleph.logic.collections import delete_collection, reindex_collection
from aleph.logic.collections import upgrade_collections, reingest_collection
from aleph.logic.processing import bulk_write
from aleph.logic.documents import crawl_directory
from aleph.logic.archive import cleanup_archive
from aleph.logic.xref import xref_collection
from aleph.logic.export import retry_exports
from aleph.logic.roles import create_user, update_roles, delete_role
from aleph.logic.permissions import update_permission

log = logging.getLogger("aleph")


def get_collection(foreign_id):
    collection = Collection.by_foreign_id(foreign_id, deleted=True)
    if collection is None:
        raise click.BadParameter("No such collection: %r" % foreign_id)
    return collection


def ensure_collection(foreign_id, label):
    authz = Authz.from_role(Role.load_cli_user())
    config = {
        "foreign_id": foreign_id,
        "label": label,
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
    print(tabulate(collections, headers=["Foreign ID", "ID", "Label"]))


@cli.command()
@click.option(
    "-s",
    "--sync",
    is_flag=True,
    default=False,
    help="Run without threads and quit when no tasks are left.",
)  # noqa
def worker(sync=False):
    """Run the queue-based worker service."""
    worker = get_worker()
    if sync:
        worker.sync()
    else:
        worker.run()


@cli.command()
@click.argument("path", type=click.Path(exists=True))
@click.option(
    "-l", "--language", multiple=True, help="ISO language codes for OCR"
)  # noqa
@click.option("-f", "--foreign_id", help="Foreign ID of the collection")
def crawldir(path, language=None, foreign_id=None):
    """Crawl the given directory."""
    path = Path(path)
    if foreign_id is None:
        foreign_id = "directory:%s" % slugify(path)
    collection = ensure_collection(foreign_id, path.name)
    log.info("Crawling %s to %s (%s)...", path, foreign_id, collection.id)
    crawl_directory(collection, path)
    log.info("Complete. Make sure a worker is running :)")
    update_collection(collection)


@cli.command()
@click.argument("foreign_id")
@click.option("--sync/--async", default=False)
def delete(foreign_id, sync=False):
    """Delete a given collection."""
    collection = get_collection(foreign_id)
    delete_collection(collection, sync=sync)


@cli.command()
@click.argument("foreign_id")
@click.option("--sync/--async", default=False)
def flush(foreign_id, sync=False):
    """Flush all the contents for a given collection."""
    collection = get_collection(foreign_id)
    delete_collection(collection, keep_metadata=True, sync=sync)


def _reindex_collection(collection, flush=False):
    log.info("[%s] Starting to re-index", collection)
    try:
        reindex_collection(collection, flush=flush)
    except Exception:
        log.exception("Failed to re-index: %s", collection)


@cli.command()
@click.argument("foreign_id")
@click.option("--flush", is_flag=True, default=False)
def reindex(foreign_id, flush=False):
    """Index all the aggregator contents for a collection."""
    collection = get_collection(foreign_id)
    _reindex_collection(collection, flush=flush)


@cli.command("reindex-full")
@click.option("--flush", is_flag=True, default=False)
def reindex_full(flush=False):
    """Re-index all collections."""
    for collection in Collection.all():
        _reindex_collection(collection, flush=flush)


@cli.command("reindex-casefiles")
@click.option("--flush", is_flag=True, default=False)
def reindex_casefiles(flush=False):
    """Re-index all the casefile collections."""
    for collection in Collection.all_casefiles():
        _reindex_collection(collection, flush=flush)


@cli.command()
@click.argument("foreign_id")
@click.option("--index", is_flag=True, default=False)
@click.option("--flush/--no-flush", default=True)
def reingest(foreign_id, index=False, flush=True):
    """Process documents and database entities and index them."""
    collection = get_collection(foreign_id)
    reingest_collection(collection, index=index, flush=flush)


@cli.command("reingest-casefiles")
@click.option("--index", is_flag=True, default=False)
def reingest_casefiles(index=False):
    """Re-ingest all the casefile collections."""
    for collection in Collection.all_casefiles():
        log.info("[%s] Starting to re-ingest", collection)
        reingest_collection(collection, index=index)


@cli.command()
def flushdeleted():
    """Remove soft-deleted database objects."""
    cleanup_deleted()


@cli.command()
def update():
    """Re-index all collections and clear some caches."""
    update_roles()
    upgrade_collections()


@cli.command()
@click.argument("foreign_id")
def xref(foreign_id):
    """Cross-reference all entities and documents in a collection."""
    collection = get_collection(foreign_id)
    xref_collection(collection)


@cli.command()
@click.argument("entityset_id")
def embed_diagram(entityset_id):
    from aleph.logic.diagrams import publish_diagram

    publish_diagram(entityset_id)


@cli.command("load-entities")
@click.argument("foreign_id")
@click.option("-i", "--infile", type=click.File("r"), default="-")  # noqa
@click.option(
    "--safe/--unsafe",
    default=True,
    help="Allow references to archive hashes.",
)
@click.option(
    "--mutable/--immutable",
    default=False,
    help="Mark entities mutable.",
)
def load_entities(foreign_id, infile, safe=False, mutable=False):
    """Load FtM entities from the specified iJSON file."""
    collection = ensure_collection(foreign_id, foreign_id)

    def read_entities():
        for idx in count(1):
            line = infile.readline()
            if not line:
                return
            if idx % 1000 == 0:
                log.info(
                    "[%s] Loaded %s entities from: %s", collection, idx, infile.name
                )
            yield json.loads(line)

    role = Role.load_cli_user()
    for _ in bulk_write(
        collection, read_entities(), safe=safe, mutable=mutable, role_id=role.id
    ):
        pass
    reindex_collection(collection)


@cli.command("dump-entities")
@click.argument("foreign_id")
@click.option("-o", "--outfile", type=click.File("w"), default="-")  # noqa
def dump_entities(foreign_id, outfile):
    """Export FtM entities for the given collection."""
    collection = get_collection(foreign_id)
    for entity in iter_proxies(collection_id=collection.id):
        write_object(outfile, entity)


@cli.command("sample-entities")
@click.option(
    "--secret",
    type=bool,
    default=None,
    help="Whether to sample from secret collections (None means sample from both)",
)
@click.option(
    "--property",
    "-p",
    "properties",
    multiple=True,
    type=str,
    default=[],
    help="Entities must have at least one of the listed properties",
)
@click.option(
    "--schemata",
    "-s",
    "schematas",
    multiple=True,
    type=str,
    default=[],
    help="Filter schematas",
)
@click.option("--seed", type=int, default=None, help="Set the random seed")
@click.option(
    "--sample-pct",
    type=float,
    default=None,
    help="Random sampling percent (value from 0-1)",
)
@click.option("--limit", type=int, default=None, help="Number of entities to return")
@click.argument("outfile", type=click.File("w+"), default="-")
def sample_entities(secret, properties, schematas, seed, sample_pct, limit, outfile):
    """Sample random entities"""
    random.seed(seed)
    authz = Authz.from_role(Role.load_cli_user())
    collections = list(Collection.all_by_secret(secret, authz))
    random.shuffle(collections)
    iter_proxies_kwargs = {
        "authz": authz,
        "schemata": schematas or None,
        "randomize": True,
        "random_seed": seed,
    }
    n_entities = 0
    for collection in collections:
        for entity in iter_proxies(collection_id=collection.id, **iter_proxies_kwargs):
            if properties and not any(
                entity.properties.get(prop) for prop in properties
            ):
                continue
            if not sample_pct or random.random() < sample_pct:
                write_object(outfile, entity)
                n_entities += 1
                if limit and n_entities >= limit:
                    return


@cli.command()
@click.argument("foreign_id", required=False)
def status(foreign_id=None):
    """Get the queue status (pending and finished tasks.)"""
    if foreign_id is not None:
        collection = get_collection(foreign_id)
        status = get_status(collection)
        status = {"datasets": {foreign_id: status}}
    else:
        status = get_active_dataset_status()
    headers = ["Collection", "Job", "Stage", "Pending", "Running", "Finished"]
    rows = []
    for foreign_id, dataset in status.get("datasets").items():
        rows.append(
            [
                foreign_id,
                "",
                "",
                dataset["pending"],
                dataset["running"],
                dataset["finished"],
            ]
        )
        for job in dataset.get("jobs"):
            for stage in job.get("stages"):
                rows.append(
                    [
                        foreign_id,
                        stage["job_id"],
                        stage["stage"],
                        stage["pending"],
                        stage["running"],
                        stage["finished"],
                    ]
                )
    print(tabulate(rows, headers))


@cli.command()
@click.argument("foreign_id")
def cancel(foreign_id):
    """Cancel all queued tasks for the dataset."""
    collection = get_collection(foreign_id)
    cancel_queue(collection)
    update_collection(collection)


@cli.command("cancel-user")
def cancel_user():
    """Cancel all queued tasks not related to a dataset."""
    cancel_queue(None)


@cli.command("retry-exports")
def retry_exports_():
    """Cancel all queued tasks not related to a dataset."""
    retry_exports()


@cli.command()
@click.argument("email")
@click.option("-p", "--password", help="Set a user password")
@click.option("-n", "--name", help="Set a label")
@click.option(
    "-a", "--admin", is_flag=True, default=False, help="Make the user an admin."
)  # noqa
def createuser(email, password=None, name=None, admin=False):  # noqa
    """Create a user and show their API key."""
    role = create_user(email, name, password, is_admin=admin)
    print("User created. ID: %s, API Key: %s" % (role.id, role.api_key))


@cli.command()
@click.argument("foreign_id")
def deleterole(foreign_id):  # noqa
    """Hard-delete a role (user, or group) from the database."""
    role = Role.by_foreign_id(foreign_id, deleted=True)
    if role is None:
        raise click.BadParameter("No such role: %r" % foreign_id)
    delete_role(role)


@cli.command()
@click.argument("foreign_id")
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
    # update_roles()
    # upgrade_collections()


@cli.command()
def resetindex():
    """Re-create the ES index configuration, dropping all data."""
    delete_index()
    upgrade_system()


@cli.command()
def resetcache():
    """Clear the redis cache."""
    cache.flush()


@cli.command("cleanup-archive")
@click.option("-p", "--prefix", help="Scan a subset with a prefix")
def cleanuparchive(prefix):
    cleanup_archive(prefix=prefix)


@cli.command()
def evilshit():
    """EVIL: Delete all data and recreate the database."""
    delete_index()
    destroy_db()
    upgrade()
