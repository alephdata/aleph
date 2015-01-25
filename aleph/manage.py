from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from aleph.core import archive
from aleph.views import app, assets
from aleph.search import init_search
from aleph.processing import make_pipeline


manager = Manager(app)
manager.add_command("assets", ManageAssets(assets))


@manager.command
def process(collection_name):
    """ Index all documents in the given collection. """
    collection = archive.get(collection_name)
    pipeline = make_pipeline(collection)
    pipeline.process()


@manager.command
def init():
    """ Create the elastic search index and database. """
    init_search()


if __name__ == "__main__":
    manager.run()
