# coding: utf-8
import logging

from flask_script import Manager
from flask_script.commands import ShowUrls
from flask_assets import ManageAssets
from flask_migrate import MigrateCommand

from aleph.core import create_app, archive
from aleph.model import db, upgrade_db, Collection, Document
from aleph.views import mount_app_blueprints, assets
from aleph.analyze import install_analyzers
from aleph.ingest import reingest_collection
from aleph.index import init_search, delete_index, upgrade_search
from aleph.index import index_document_id
from aleph.logic import reindex_entities, delete_collection, analyze_collection
from aleph.logic.alerts import check_alerts
from aleph.ext import get_crawlers
from aleph.crawlers.directory import DirectoryCrawler
from aleph.crawlers.metafolder import MetaFolderCrawler


log = logging.getLogger('aleph')

app = create_app()
mount_app_blueprints(app)
manager = Manager(app)
manager.add_command('assets', ManageAssets(assets))
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
    if foreign_id:
        collection = Collection.by_foreign_id(foreign_id)
        if collection is None:
            raise ValueError("No such collection: %r" % foreign_id)
        clause = Collection.id == collection.id
        q = q.filter(Document.collections.any(clause))
    for doc_id, in q:
        index_document_id.delay(doc_id)
    if foreign_id is None:
        reindex_entities()


@manager.command
def resetindex():
    """Re-create the ES index configuration, dropping all data."""
    delete_index()
    init_search()


@manager.command
def indexentities(foreign_id=None):
    """Re-index all the entities."""
    reindex_entities()


@manager.command
@manager.option('-s', '--skip', dest='skip', default='')
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
    db.drop_all()
    from sqlalchemy import MetaData, inspect
    from sqlalchemy.dialects.postgresql import ENUM
    metadata = MetaData()
    metadata.bind = db.engine
    metadata.reflect()
    for table in metadata.sorted_tables:
        table.drop(checkfirst=True)
    for enum in inspect(db.engine).get_enums():
        enum = ENUM(name=enum['name'])
        enum.drop(bind=db.engine, checkfirst=True)
    init()


def main():
    manager.run()


if __name__ == "__main__":
    main()
