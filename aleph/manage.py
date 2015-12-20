import os
import logging

from normality import slugify
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from flask.ext.migrate import MigrateCommand

from aleph.model import db, Source
from aleph.views import app, assets
from aleph.analyze import analyze_source
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
def crawldir(directory, source=None, force=False):
    """ Crawl the given directory. """
    directory = os.path.abspath(directory)
    directory = os.path.normpath(directory)
    source = source or directory
    source = Source.create({
        'key': 'directory:%s' % slugify(source),
        'label': source
    })
    log.info('Crawling %r, to %r', directory, source)
    crawler = DirectoryCrawler(source)
    crawler.crawl(directory=directory)
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
    db.drop_all()
    db.create_all()


def main():
    manager.run()

if __name__ == "__main__":
    main()
