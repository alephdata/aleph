from flask.ext.script import Manager

from docsift.app import archive, app

manager = Manager(app)


@manager.command
def process(collection_name):
    """ Index all documents in the given collection. """
    for package in archive.get(collection_name):
        print package


if __name__ == "__main__":
    manager.run()
