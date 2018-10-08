# coding: utf-8
import os
import logging
from normality import slugify
from ingestors.util import decode_path
from alephclient.tasks.util import load_config_file
from flask_script import Manager, commands as flask_script_commands
from flask_script.commands import ShowUrls
from flask_migrate import MigrateCommand

from aleph.core import create_app, archive
from aleph.model import db, upgrade_db, destroy_db
from aleph.model import Collection, Document, Role
from aleph.views import mount_app_blueprints
from aleph.index.admin import delete_index, upgrade_search
from aleph.logic.collections import create_collection
from aleph.logic.collections import update_collection, update_collections
from aleph.logic.collections import delete_collection, delete_documents
from aleph.logic.collections import delete_entities
from aleph.logic.collections import update_collection_access
from aleph.logic.documents import ingest_document
from aleph.logic.documents import process_documents
from aleph.logic.scheduled import daily, hourly
from aleph.logic.roles import update_role, update_roles
from aleph.logic.entities import bulk_load, update_entities
from aleph.logic.xref import xref_collection
from aleph.logic.permissions import update_permission

log = logging.getLogger('aleph')
flask_script_commands.text_type = str

app = create_app()
mount_app_blueprints(app)
manager = Manager(app)
manager.add_command('db', MigrateCommand)
manager.add_command('routes', ShowUrls)


def get_collection(foreign_id):
    collection = Collection.by_foreign_id(foreign_id, deleted=True)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    return collection


@manager.command
def collections():
    """List all collections."""
    for collection in Collection.all():
        print(collection.id, collection.foreign_id, collection.label)


@manager.command
def scheduled():
    """Run scheduled clean-up and notification operations."""
    hourly()
    daily()


@manager.command
@manager.option('-l', '--language', dest='language', nargs='*')
@manager.option('-f', '--foreign_id', dest='foreign_id')
def crawldir(path, language=None, foreign_id=None):
    """Crawl the given directory."""
    path = decode_path(os.path.abspath(os.path.normpath(path)))
    if path is None or not os.path.exists(path):
        log.error("Invalid path: %r", path)
        return
    path_name = os.path.basename(path)

    if foreign_id is None:
        foreign_id = 'directory:%s' % slugify(path)

    collection = create_collection({
        'foreign_id': foreign_id,
        'label': path_name,
        'languages': language
    })
    log.info('Crawling %s to %s...', path, foreign_id)
    document = Document.by_keys(collection=collection, foreign_id=path)
    document.file_name = path_name
    db.session.commit()
    ingest_document(document, path)


@manager.command
def flush(foreign_id):
    """Reset the crawler state for a given collecton."""
    collection = get_collection(foreign_id)
    delete_collection(collection)


@manager.command
def flushdocuments(foreign_id):
    """Delete all documents from given collection."""
    collection = get_collection(foreign_id)
    delete_documents(collection.id)
    db.session.commit()


@manager.command
def flushentities(foreign_id):
    """Delete all entities from given collection."""
    collection = get_collection(foreign_id)
    delete_entities(collection.id)
    db.session.commit()


@manager.command
@manager.option('-f', '--foreign_id')
@manager.option('-i', '--index', default=False)
@manager.option('-r', '--retry', default=False)
def process(foreign_id=None, index=False, retry=False):
    """Re-process documents in the given collection."""
    collection_id = None
    if foreign_id:
        collection_id = get_collection(foreign_id).id
    process_documents(collection_id=collection_id,
                      index_only=index,
                      failed_only=retry)


@manager.command
def xref(foreign_id):
    """Cross-reference all entities and documents in a collection."""
    collection = get_collection(foreign_id)
    xref_collection(collection.id)


@manager.command
def bulkload(file_name):
    """Index all the entities in a given dataset."""
    log.info("Loading bulk data from: %s", file_name)
    config = load_config_file(file_name)
    bulk_load(config)


@manager.command
def resetindex():
    """Re-create the ES index configuration, dropping all data."""
    delete_index()
    upgrade_search()


@manager.command
def repair():
    """Re-index all the collections and entities."""
    update_collections()
    update_entities()
    update_roles()


@manager.command
@manager.option('-n', '--name', dest='name')
@manager.option('-e', '--email', dest='email')
@manager.option('-i', '--is_admin', dest='is_admin')
@manager.option('-p', '--password', dest='password')
def createuser(foreign_id, password=None, name=None, email=None,
               is_admin=False):
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


@manager.command
def publish(foreign_id):
    """Make a collection visible to all users."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    role = Role.by_foreign_id(Role.SYSTEM_GUEST)
    editor = Role.load_cli_user()
    update_permission(role, collection, True, False, editor_id=editor.id)
    update_collection_access(collection.id)
    update_collection(collection)


@manager.command
def graph(entity_id):
    """Generate a graph around the given entity."""
    from aleph.logic.graph import export_node
    graph = export_node(entity_id, steam=1000)
    with open('%s.gexf' % entity_id, 'w', encoding='utf-8') as fh:
        fh.write(graph)
    # print(graph)


@manager.command
def upgrade():
    """Create or upgrade the search index and database."""
    upgrade_db()
    upgrade_search()
    archive.upgrade()


@manager.command
def evilshit():
    """EVIL: Delete all data and recreate the database."""
    delete_index()
    destroy_db()
    upgrade()


def main():
    manager.run()


if __name__ == "__main__":
    main()
