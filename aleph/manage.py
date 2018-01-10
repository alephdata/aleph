# coding: utf-8
import os
import logging
import datetime
from normality import slugify
from ingestors.util import decode_path
from flask_script import Manager, commands as flask_script_commands
from flask_script.commands import ShowUrls
from flask_migrate import MigrateCommand

from aleph.core import create_app, archive
from aleph.model import db, upgrade_db
from aleph.model import Collection, Document, Role
from aleph.views import mount_app_blueprints
from aleph.views.triples import export_collections
from aleph.analyze import install_analyzers
from aleph.ingest import ingest_document
from aleph.index.admin import delete_index, upgrade_search
from aleph.index.documents import index_document_id
from aleph.logic.collections import update_collection, process_collection
from aleph.logic.collections import delete_collection
from aleph.logic.alerts import check_alerts
from aleph.logic.entities import bulk_load, reindex_entities
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
        print collection.id, collection.foreign_id, collection.label


@manager.command
def alerts():
    """Generate alert notifications."""
    check_alerts.delay()


@manager.command
@manager.option('-l', '--language', dest='language', nargs='*')
@manager.option('-c', '--country', dest='country', nargs='*')
@manager.option('-f', '--foreign_id', dest='foreign_id')
def crawldir(path, language=None, country=None, foreign_id=None):
    """Crawl the given directory."""
    path = decode_path(path)
    if path is None or not os.path.exists(path):
        log.error("Invalid path: %r", path)
        return
    path = os.path.abspath(os.path.normpath(path))
    path_name = os.path.basename(path)

    if foreign_id is None:
        foreign_id = 'directory:%s' % slugify(path)
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        collection = Collection.create({
            'foreign_id': foreign_id,
            'label': path_name,
            'managed': True
        })

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
    ingest_document(document, path)


@manager.command
def flush(foreign_id):
    """Reset the crawler state for a given collecton."""
    collection = Collection.by_foreign_id(foreign_id, deleted=True)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    delete_collection(collection.id)


@manager.command
def process(foreign_id):
    """Re-process documents in the given collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    process_collection(collection.id)


@manager.command
def xref(foreign_id):
    """Cross-reference all entities and documents in a collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    xref_collection(collection)


@manager.command
def index(foreign_id=None):
    """Index documents in the given collection (or throughout)."""
    q = Document.all_ids()
    # re-index newest document first.
    q = q.order_by(Document.id.desc())
    if foreign_id:
        collection = Collection.by_foreign_id(foreign_id)
        if collection is None:
            raise ValueError("No such collection: %r" % foreign_id)
        q = q.filter(Document.collection_id == collection.id)
    for idx, (doc_id,) in enumerate(q.yield_per(5000), 1):
        index_document_id.delay(doc_id)
        if idx % 1000 == 0:
            log.info("Index: %s documents...", idx)
    if foreign_id is None:
        reindex_entities()


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
def indexentities():
    """Re-index all the entities."""
    reindex_entities()


@manager.command
@manager.option('-n', '--name', dest='name')
@manager.option('-e', '--email', dest='email')
@manager.option('-i', '--is_admin', dest='is_admin')
def createuser(foreign_id, name=None, email=None, is_admin=False):
    """Create a user and show their API key."""
    role = Role.load_or_create(foreign_id, Role.USER,
                               name or foreign_id,
                               email=email or "user@example.com",
                               is_admin=is_admin)
    db.session.commit()
    return role.api_key


@manager.command
def publish(foreign_id):
    """Make a collection visible to all users."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    role = Role.by_foreign_id(Role.SYSTEM_GUEST)
    update_permission(role, collection, True, False)
    db.session.commit()


@manager.command
def upgrade():
    """Create or upgrade the search index and database."""
    upgrade_db()
    upgrade_search()
    archive.upgrade()


@manager.command
def installdata():
    """Install data needed for linguistic processing."""
    install_analyzers()


@manager.command
def evilshit():
    """EVIL: Delete all data and recreate the database."""
    delete_index()
    from sqlalchemy import MetaData, inspect
    from sqlalchemy.exc import InternalError
    from sqlalchemy.dialects.postgresql import ENUM
    metadata = MetaData()
    metadata.bind = db.engine
    metadata.reflect()
    tables = list(metadata.sorted_tables)
    while len(tables):
        for table in tables:
            try:
                table.drop(checkfirst=True)
                tables.remove(table)
            except InternalError:
                pass
    for enum in inspect(db.engine).get_enums():
        enum = ENUM(name=enum['name'])
        enum.drop(bind=db.engine, checkfirst=True)
    upgrade()


@manager.command
def rdfdump():
    
    dump = export_collections()

    dump_path = '/aleph/build/data/dumps'
    if not os.path.exists(dump_path):
        os.makedirs(dump_path)
    fn = '%s/rdfdump_%s.n3' % (dump_path,
                               datetime.datetime.now().strftime('%Y%m%d%H%M%S%f'))
    with open(fn, 'w') as f:
        f.write(dump)

    log.info('RDF dump written to %s' % fn)


def main():
    manager.run()


if __name__ == "__main__":
    main()
