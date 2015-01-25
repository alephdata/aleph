from flask.ext.script import Manager
from flask.ext.assets import ManageAssets

from aleph.core import archive
from aleph.views import app, assets


manager = Manager(app)
manager.add_command("assets", ManageAssets(assets))


@manager.command
def process(collection_name):
    """ Index all documents in the given collection. """
    for package in archive.get(collection_name):
        print package


if __name__ == "__main__":
    manager.run()
