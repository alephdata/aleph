from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from flask.ext.migrate import MigrateCommand

from aleph.core import archive
from aleph.model import db, CrawlState
from aleph.views import app, assets
from aleph.processing import make_pipeline, process_collection
from aleph.crawlers import crawl_source
from aleph.upgrade import upgrade as upgrade_, reset as reset_


manager = Manager(app)
manager.add_command('assets', ManageAssets(assets))
manager.add_command('db', MigrateCommand)


@manager.command
def crawl(source, force=False):
    """ Execute the crawler for a given source specification. """
    crawl_source(source, ignore_tags=force)


@manager.command
def flush(source):
    """ Reset the crawler state for a given source specification. """
    CrawlState.flush(source)
    db.session.commit()


@manager.command
def process(collection_name, force=False):
    """ Index all documents in the given collection. """
    process_collection.delay(collection_name, overwrite=force)


@manager.command
def fixture(name):
    """ Load a list fixture. """
    # TODO: replace this whole thing with something more frameworky
    from aleph.processing.fixtures import load_fixture
    load_fixture(name)


@manager.command
def reset():
    """ Delete and re-create the search index and database. """
    reset_()


@manager.command
def upgrade():
    """ Create or upgrade the search index and database. """
    upgrade_()


def main():
    manager.run()

if __name__ == "__main__":
    main()
