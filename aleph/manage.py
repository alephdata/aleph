from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from aleph.core import archive
from aleph.model import db, Collection
from aleph.views import app, assets
from aleph.search import init_search
from aleph.processing import make_pipeline
from aleph.crawlers import crawl_source


manager = Manager(app)
manager.add_command("assets", ManageAssets(assets))

# Hacky much?
Collection.sync()


@manager.command
def crawl(source):
    """ Execute the crawler for a given source specification. """
    crawl_source(source)


@manager.command
def process(collection_name):
    """ Index all documents in the given collection. """
    collection = archive.get(collection_name)
    pipeline = make_pipeline(collection)
    pipeline.process_sync()


@manager.command
def init():
    """ Create the elastic search index and database. """
    db.drop_all()
    db.create_all()
    init_search()


if __name__ == "__main__":
    manager.run()
