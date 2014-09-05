from flask.ext.script import Manager

from docsift.app import stash
from docsift.views import app
from docsift.search import index_document

manager = Manager(app)


@manager.command
def index(collection_name):
    """ Index all documents in the given collection. """
    for document in stash.get(collection_name):
        print document
        index_document(document)

if __name__ == "__main__":
    manager.run()
