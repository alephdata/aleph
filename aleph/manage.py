import os
import logging

from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from flask.ext.migrate import MigrateCommand

from aleph.model import db, Source, Document
from aleph.views import app, assets
from aleph.analyze import analyze_source
from aleph.index import init_search, delete_index, index_document
from aleph.ext import get_crawlers
from aleph.crawlers.directory import DirectoryCrawler
from aleph.crawlers.sql import SQLCrawler
from aleph.upgrade import upgrade as upgrade_, reset as reset_


log = logging.getLogger('aleph')
manager = Manager(app)
manager.add_command('assets', ManageAssets(assets))
manager.add_command('db', MigrateCommand)


@manager.command
def sources():
    """ List all sources. """
    for source in db.session.query(Source):
        print source.id, source.foreign_id, source.label


@manager.command
def crawl(name):
    """ Execute the given crawler. """
    log.info('Crawling %r...', name)
    crawlers = get_crawlers()
    if name not in crawlers:
        log.info('No such crawler: %r', name)
    else:
        crawler = crawlers.get(name)()
        crawler.crawl()
    db.session.commit()


@manager.command
def crawldir(directory, source=None):
    """ Crawl the given directory. """
    directory = os.path.abspath(directory)
    directory = os.path.normpath(directory)
    log.info('Crawling %r...', directory)
    DirectoryCrawler().crawl(directory=directory, source=source)


@manager.command
def crawlsql(yaml_config, source=None):
    """ Crawl the given database query file. """
    yaml_config = os.path.abspath(yaml_config)
    yaml_config = os.path.normpath(yaml_config)
    log.info('Crawling %r...', yaml_config)
    SQLCrawler().crawl(config=yaml_config, source=source)
    db.session.commit()


@manager.command
def reanalyze():
    from aleph.analyze import analyze_source
    for source in Source.all():
        analyze_source.delay(source.id)


@manager.command
def flush(foreign_id):
    """ Reset the crawler state for a given source specification. """
    from aleph.index import delete_source
    source = Source.by_foreign_id(foreign_id)
    if source is None:
        raise ValueError("No such source: %r" % foreign_id)
    delete_source(source.id)
    source.delete()
    db.session.commit()


@manager.command
def analyze(foreign_id):
    """ Re-analyze all documents in the given source. """
    source = Source.by_foreign_id(foreign_id)
    if source is None:
        raise ValueError("No such source: %r" % foreign_id)
    analyze_source.delay(source.id)


@manager.command
def index(foreign_id=None):
    """ Index all documents in the given source. """
    q = db.session.query(Document.id)
    if foreign_id:
        source = Source.by_foreign_id(foreign_id)
        if source is None:
            raise ValueError("No such source: %r" % foreign_id)
        q = q.filter(Document.source_id == source.id)
    else:
        delete_index()
        init_search()
    for doc_id, in q:
        index_document.delay(doc_id)


@manager.command
def reset():
    """ Delete and re-create the search index and database. """
    reset_()


@manager.command
def upgrade():
    """ Create or upgrade the search index and database. """
    upgrade_()


@manager.command
def createdb():
    db.drop_all()
    db.create_all()
    delete_index()
    init_search()


def main():
    manager.run()

if __name__ == "__main__":
    main()
