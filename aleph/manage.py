# coding: utf-8
import logging

from flask_script import Manager, commands as flask_script_commands
from flask_script.commands import ShowUrls
from flask_migrate import MigrateCommand

from aleph.core import create_app, archive, datasets
from aleph.model import db, upgrade_db, Collection, Document, Entity
from aleph.views import mount_app_blueprints
from aleph.analyze import install_analyzers
from aleph.ingest import reingest_collection
from aleph.index import init_search, delete_index, upgrade_search
from aleph.index import index_document_id, delete_dataset
from aleph.logic import reindex_entities, delete_collection, analyze_collection
from aleph.logic import load_dataset, update_entity_full, delete_pending
from aleph.logic.alerts import check_alerts
from aleph.ext import get_crawlers
from aleph.crawlers.directory import DirectoryCrawler
from aleph.crawlers.metafolder import MetaFolderCrawler


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
def crawl(name):
    """Execute the given crawler."""
    log.info('Crawling %r...', name)
    crawlers = get_crawlers()
    if name not in crawlers:
        log.info('No such crawler: %r', name)
    else:
        crawler = crawlers.get(name)()
        crawler.execute()
    db.session.commit()


@manager.command
@manager.option('-l', '--language', dest='language', nargs='*')
@manager.option('-c', '--country', dest='country', nargs='*')
@manager.option('-f', '--foreign_id', dest='foreign_id')
def crawldir(directory, language=None, country=None, foreign_id=None):
    """Crawl the given directory."""
    log.info('Crawling %r...', directory)
    meta = {}
    if language is not None:
        meta['languages'] = [language]
    if country is not None:
        meta['countries'] = [country]
    crawler = DirectoryCrawler()
    crawler.execute(directory=directory, meta=meta, foreign_id=foreign_id)


@manager.command
def metafolder(folder):
    """Crawl the given metafolder path."""
    log.info('Importing %r...', folder)
    MetaFolderCrawler().execute(folder=folder)
    db.session.commit()


@manager.command
def flush(foreign_id):
    """Reset the crawler state for a given collecton."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    delete_collection(collection.id)


@manager.command
def deletepending(foreign_id=None):
    """Deletes any pending entities and related items."""
    collection_id = None
    if foreign_id is None:
        collection = Collection.by_foreign_id(foreign_id)
        if collection is None:
            raise ValueError("No such collection: %r" % foreign_id)
        collection_id = collection.id
    delete_pending(collection_id=collection_id)


@manager.command
def analyze(foreign_id):
    """Re-analyze documents in the given collection (or throughout)."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    analyze_collection.delay(collection.id)


@manager.command
def reingest(foreign_id):
    """Re-ingest documents in the given collection."""
    collection = Collection.by_foreign_id(foreign_id)
    if collection is None:
        raise ValueError("No such collection: %r" % foreign_id)
    reingest_collection(collection)


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
    for idx, (doc_id,) in enumerate(q.yield_per(10000), 1):
        index_document_id.delay(doc_id)
        if idx % 1000 == 0:
            log.info("Index: %s documents...", idx)
    if foreign_id is None:
        reindex_entities()


@manager.command
def loaddataset(name):
    """Index all the entities in a given dataset."""
    dataset = datasets.get(name)
    load_dataset(dataset)


@manager.command
def deletedataset(name):
    delete_dataset(name)


@manager.command
def resetindex():
    """Re-create the ES index configuration, dropping all data."""
    delete_index()
    init_search()


@manager.command
def indexentities():
    """Re-index all the entities."""
    reindex_entities()


@manager.command
def updateentities():
    """Re-index all the entities."""
    q = db.session.query(Entity.id)
    for (entity_id,) in q:
        update_entity_full.delay(entity_id)


@manager.command
@manager.option('-s', '--skip-downloads', dest='skip', default='')
def init(skip=''):
    """Create or upgrade the search index and database."""
    upgrade_db()
    init_search()
    upgrade_search()
    if 'analyzers' not in skip:
        install_analyzers()
    archive.upgrade()


@manager.command
def upgrade():
    """Create or upgrade the search index and database."""
    upgrade_db()
    upgrade_search()
    archive.upgrade()


@manager.command
def installdata():
    """Create or upgrade the search index and database."""
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
    init()


def main():
    manager.run()


if __name__ == "__main__":
    main()
