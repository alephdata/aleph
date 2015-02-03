from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from aleph.core import archive
from aleph.model import db, Collection, CrawlState
from aleph.views import app, assets
from aleph.search import init_search, delete_index
from aleph.processing import make_pipeline
from aleph.crawlers import crawl_source


manager = Manager(app)
manager.add_command("assets", ManageAssets(assets))


@manager.command
def crawl(source, force=False):
    """ Execute the crawler for a given source specification. """
    Collection.sync()
    crawl_source(source, ignore_tags=force)


@manager.command
def flush(source):
    """ Reset the crawler state for a given source specification. """
    Collection.sync()
    CrawlState.flush(source)
    db.session.commit()


@manager.command
def process(collection_name, force=False):
    """ Index all documents in the given collection. """
    Collection.sync()
    collection = archive.get(collection_name)
    pipeline = make_pipeline(collection, overwrite=force)
    pipeline.process_sync()


@manager.command
def fixture(name):
    """ Load a list fixture. """
    from aleph.processing.fixtures import load_fixture
    load_fixture(name)


@manager.command
def reset():
    """ Delete and re-create the search index and database. """
    db.drop_all()
    delete_index()
    init_search()
    Collection.sync()


@manager.command
def upgrade():
    """ Create or upgrade the search index and database. """
    init_search()
    Collection.sync()


def main():
    manager.run()

if __name__ == "__main__":
    main()
