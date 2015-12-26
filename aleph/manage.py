import os
import logging

from normality import slugify
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from flask.ext.migrate import MigrateCommand

from aleph.model import db, Source
from aleph.views import app, assets
from aleph.analyze import analyze_source
from aleph.ext import get_crawlers
from aleph.crawlers.directory import DirectoryCrawler
from aleph.upgrade import upgrade as upgrade_, reset as reset_


log = logging.getLogger('aleph')
manager = Manager(app)
manager.add_command('assets', ManageAssets(assets))
manager.add_command('db', MigrateCommand)


@manager.command
def sources():
    """ List all sources. """
    for source in db.session.query(Source):
        print source.id, source.key, source.label


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
def crawldir(directory, source=None, force=False):
    """ Crawl the given directory. """
    directory = os.path.abspath(directory)
    directory = os.path.normpath(directory)
    log.info('Crawling %r (src tag: %r)', directory, source)
    DirectoryCrawler().crawl(directory=directory, source=source)
    db.session.commit()


@manager.command
def flush(source):
    """ Reset the crawler state for a given source specification. """
    db.session.commit()


@manager.command
def analyze(source_key, force=False):
    """ Index all documents in the given source. """
    source = Source.by_key(source_key)
    if source is None:
        raise ValueError("No such source: %r" % source_key)
    analyze_source.delay(source.id)


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
    from aleph.index import init_search, delete_index
    db.drop_all()
    db.create_all()
    delete_index()
    init_search()


def main():
    manager.run()

if __name__ == "__main__":
    main()
