# coding: utf-8
import sys
import json
import click
import logging
from pathlib import Path
from pprint import pprint  # noqa
from itertools import count
from normality import slugify
from tabulate import tabulate
from flask.cli import FlaskGroup
from followthemoney.cli.util import write_object

from aleph.core import create_app, cache, db
from aleph.authz import Authz
from aleph.model import Collection, Role, EntitySet
from aleph.migration import upgrade_system, destroy_db, cleanup_deleted
from aleph.worker import get_worker
from aleph.queues import get_status, cancel_queue
from aleph.queues import get_active_dataset_status
from aleph.index.admin import delete_index
from aleph.index.entities import iter_proxies
from aleph.logic.collections import create_collection, update_collection
from aleph.logic.collections import delete_collection, reindex_collection
from aleph.logic.collections import upgrade_collections, reingest_collection
from aleph.logic.collections import compute_collection
from aleph.logic.processing import bulk_write
from aleph.logic.mapping import cleanup_mappings
from aleph.logic.documents import crawl_directory
from aleph.logic.archive import cleanup_archive
from aleph.logic.xref import xref_collection
from aleph.logic.export import retry_exports
from aleph.logic.roles import (
    create_user,
    create_group,
    update_roles,
    user_add,
    user_del,
    delete_role,
    rename_user,
)
from aleph.logic.permissions import update_permission
from aleph.util import JSONEncoder
from aleph.index.collections import get_collection as _get_index_collection
from aleph.index.entities import get_entity as _get_index_entity

log = logging.getLogger("aleph")


def get_expanded_entity(entity_id):
    if not entity_id:
        return None
    entity = _get_index_entity(entity_id)
    if entity is None:
        return None
    entity.pop("_index", None)
    entity["collection"] = _get_index_collection(entity["collection_id"])
    return entity


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
@click.option(
    "--secret",
    type=bool,
    default=None,
    help="Whether to list secret collections (None means disregard the flag)",
)
@click.option(
    "--casefile",
    type=bool,
    default=None,
    help="Whether to list casefiles (None means disregard the flag)",
)
def collections(secret, casefile):
    """List all collections."""
    collections = []
    for coll in Collection.all():
        if secret is not None:
            if coll.secret != secret:
                continue
        if casefile is not None:
            if coll.casefile != casefile:
                continue
        collections.append((coll.foreign_id, coll.id, coll.label))
    print(tabulate(collections, headers=["Foreign ID", "ID", "Label"]))


@cli.command()
@click.option(
    "--blocking/--non-blocking", default=True, help="Wait for tasks indefinitely."
)
@click.option("--threads", required=False, type=int)
def worker(blocking=True, threads=None):
    """Run the queue-based worker service."""
    worker = get_worker(num_threads=threads)
    code = worker.run(blocking=blocking)
    sys.exit(code)


@cli.command()
@click.argument("path", type=click.Path(exists=True))
@click.option("-l", "--language", multiple=True, help="ISO language codes for OCR")
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
@click.option("--sync/--async", default=True)
def touch(foreign_id, sync=True):
    """Mark a collection as changed."""
    collection = get_collection(foreign_id)
    collection.touch()
    db.session.commit()
    compute_collection(collection, force=True, sync=True)


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
@click.option("--include_ingest", is_flag=True, default=False)
@click.option("--flush/--no-flush", default=True)
def reingest(foreign_id, index=False, flush=True, include_ingest=False):
    """Process documents and database entities and index them."""
    collection = get_collection(foreign_id)
    reingest_collection(
        collection, index=index, flush=flush, include_ingest=include_ingest
    )


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
    cleanup_mappings()


@cli.command()
@click.argument("foreign_id")
def xref(foreign_id):
    """Cross-reference all entities and documents in a collection."""
    collection = get_collection(foreign_id)
    xref_collection(collection)


@cli.command("load-entities")
@click.argument("foreign_id")
@click.option("-i", "--infile", type=click.File("r"), default="-")
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
@click.option("-o", "--outfile", type=click.File("w"), default="-")
def dump_entities(foreign_id, outfile):
    """Export FtM entities for the given collection."""
    collection = get_collection(foreign_id)
    for entity in iter_proxies(collection_id=collection.id):
        write_object(outfile, entity)


@cli.command("dump-profiles")
@click.option("-o", "--outfile", type=click.File("w"), default="-")
@click.option("-f", "--foreign_id", help="Foreign ID of the collection")
def dump_profiles(outfile, foreign_id=None):
    """Export profile entityset items for the given collection."""
    entitysets = EntitySet.by_type(EntitySet.PROFILE)
    if foreign_id is not None:
        collection = get_collection(foreign_id)
        entitysets = entitysets.filter(EntitySet.collection_id == collection.id)
    encoder = JSONEncoder(sort_keys=True)
    for entityset in entitysets:
        for item in entityset.items():
            data = item.to_dict(entityset=entityset)
            data["entity"] = get_expanded_entity(data.get("entity_id"))
            data["compared_to_entity"] = get_expanded_entity(
                data.get("compared_to_entity_id")
            )
            outfile.write(encoder.encode(data) + "\n")


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
)
def createuser(email, password=None, name=None, admin=False):
    """Create a user and show their API key."""
    role = create_user(email, name, password, is_admin=admin)
    print("User created. ID: %s, API Key: %s" % (role.id, role.api_key))


@cli.command()
@click.argument("email")
@click.argument("name")
def renameuser(email, name):
    """Rename an already-existing user."""
    role = rename_user(email, name)
    if role:
        print(f"User renamed. ID: {role.id}, new name: {role.name}")
    else:
        print(f"The e-mail address {email} belongs to no user.")


@cli.command()
@click.argument("name")
def creategroup(name):
    """Create a user group."""
    role = create_group(name)
    print(f"Group {name} created.")


@cli.command()
@click.argument("group")
@click.argument("user")
def useradd(group, user):
    """Add user to group.

    GROUP and USER are both foreign IDs."""
    user_role, group_role = user_add(group, user)
    if user_role is not None and group_role is not None:
        print(f"Added user {user} to group {group}")
    if user_role is None:
        raise click.BadParameter(f"No such role: {user}")
    if group_role is None:
        raise click.BadParameter(f"No such role: {group}")


@cli.command()
@click.argument("group")
@click.argument("user")
def userdel(group, user):
    """Remove user from group.

    GROUP and USER are both foreign IDs.
    """
    user_role, group_role = user_del(group, user)
    if user_role is not None and group_role is not None:
        print(f"Removed user {user} from group {group}")
    if user_role is None:
        raise click.BadParameter(f"No such role: {user}")
    if group_role is None:
        raise click.BadParameter(f"No such role: {group}")


@cli.command()
def users():
    """List all users and their groups."""
    all_users = [
        (
            u.foreign_id,
            u.id,
            u.email,
            u.name,
            u.is_admin,
            ", ".join(sorted(u.name for u in u.roles)),
        )
        for u in Role.all_users()
    ]
    print(
        tabulate(
            all_users,
            headers=["Foreign ID", "ID", "E-Mail", "Name", "is admin", "groups"],
        )
    )


@cli.command()
def groups():
    """List all groups."""
    authz = Authz.from_role(Role.load_cli_user())
    all_groups = [(g.foreign_id, g.id, g.name) for g in Role.all_groups(authz)]
    print(tabulate(all_groups, headers=["Foreign ID", "ID", "Name"]))


@cli.command()
@click.argument("foreign_id")
def deleterole(foreign_id):
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
    db.session.commit()


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
