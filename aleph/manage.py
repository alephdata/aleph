# coding: utf-8
import os
import logging
from normality import slugify
from ingestors.util import decode_path
from flask_script import Manager, commands as flask_script_commands
from flask_script.commands import ShowUrls
from flask_migrate import MigrateCommand

from aleph.core import create_app, archive
from aleph.model import db, upgrade_db, destroy_db
from aleph.model import Collection, Document, Role
from aleph.views import mount_app_blueprints
from aleph.index.admin import delete_index, upgrade_search
from aleph.logic.collections import update_collection, update_collections
from aleph.logic.collections import process_collection, delete_entities
from aleph.logic.collections import delete_collection, delete_documents
from aleph.logic.collections import update_collection_access
from aleph.logic.documents import ingest_document, ingest
from aleph.logic.scheduled import daily, hourly
from aleph.logic.roles import update_role, update_roles
from aleph.logic.entities import bulk_load
from aleph.logic.documents import index_documents
from aleph.logic.xref import xref_collection
from aleph.logic.permissions import update_permission
from aleph.util import load_config_file


log = logging.getLogger('aleph')
flask_script_commands.text_type = str

app = create_app()
mount_app_blueprints(app)
manager = Manager(app)
manager.add_command('db', MigrateCommand)
manager.add_command('routes', ShowUrls)


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
@manager.option('-c', '--country', dest='country', nargs='*')
@manager.option('-f', '--foreign_id', dest='foreign_id')
def crawldir(path, language=None, country=None, foreign_id=None):
    """Crawl the given directory."""
    path = decode_path(os.path.abspath(os.path.normpath(path)))
    if path is None or not os.path.exists(path):
        log.error("Invalid path: %r", path)
        return
    path_name = os.path.basename(path)

    if foreign_id is None:
        foreign_id = 'directory:%s' % slugify(path)

    role = Role.load_cli_user()
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        collection = Collection.create({
            'foreign_id': foreign_id,
            'label': path_name,
            'casefile': False
        }, role=role)

    if language is not None:
        collection.languages = [language]
    if country is not None:
        collection.countries = [country]
    db.session.commit()
    update_collection(collection)

    log.info('Crawling %r to %r...', path, collection.foreign_id)
    document = Document.by_keys(collection=collection,
                                foreign_id=path)
    document.file_name = path_name
    ingest_document(document, path, role_id=role.id)


@manager.command
def flush(foreign_id):
    """Reset the crawler state for a given collecton."""
    collection = Collection.by_foreign_id(foreign_id, deleted=True)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    delete_collection(collection)


@manager.command
def flushdocuments(foreign_id):
    """Delete all documents from given collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    delete_documents(collection.id)
    db.session.commit()


@manager.command
def flushentities(foreign_id):
    """Delete all entities from given collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    delete_entities(collection.id)
    db.session.commit()


@manager.command
def process(foreign_id):
    """Re-process documents in the given collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    process_collection(collection.id)


@manager.command
def retry(foreign_id=None):
    """Retry importing documents which were not successfully parsed."""
    q = Document.all_ids()
    q = q.filter(Document.status != Document.STATUS_SUCCESS)
    if foreign_id is not None:
        collection = Collection.by_foreign_id(foreign_id)
        q = q.filter(Document.collection_id == collection.id)

    log.info("Retry: %s documents", q.count())
    for idx, (doc_id,) in enumerate(q.all(), 1):
        ingest.apply_async([doc_id], priority=1)
        if idx % 1000 == 0:
            log.info("Process: %s documents...", idx)


@manager.command
def xref(foreign_id):
    """Cross-reference all entities and documents in a collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    xref_collection(collection.id)


@manager.command
def index(foreign_id=None):
    """Index documents in the given collection (or throughout)."""
    collection_id = None
    if foreign_id:
        collection = Collection.by_foreign_id(foreign_id)
        if collection is None:
            raise ValueError("No such collection: %r" % foreign_id)
        collection = collection.id
    index_documents(collection_id=collection_id)


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
    update_roles()
    update_collections()


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
    update_role(role)
    db.session.commit()
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
