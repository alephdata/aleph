from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from aleph.core import archive
from aleph.model import db, Collection, CrawlState
from aleph.views import app, assets
from aleph.search import init_search
from aleph.processing import make_pipeline
from aleph.crawlers import crawl_source


manager = Manager(app)
manager.add_command("assets", ManageAssets(assets))


@manager.command
def crawl(source, force=False):
    """ Execute the crawler for a given source specification. """
    crawl_source(source, ignore_tags=force)


@manager.command
def reset(source):
    """ Reset the crawler state for a given source specification. """
    CrawlState.flush(source)
    db.session.commit()


@manager.command
def process(collection_name, force=False):
    """ Index all documents in the given collection. """
    collection = archive.get(collection_name)
    pipeline = make_pipeline(collection, overwrite=force)
    pipeline.process_sync()


@manager.command
def init():
    """ Create the elastic search index and database. """
    #db.drop_all()
    db.create_all()
    #init_search()
    # Hacky much?
    Collection.sync()


def main():
    manager.run()

if __name__ == "__main__":
    main()
