from flask.ext.script import Manager

from dit.app import stash
from dit.views import app
from dit.search import index_document

manager = Manager(app)


@manager.command
def index(collection_name):
    """ Index all documents in the given collection. """
    for document in stash.get(collection_name):
        index_document(document)

if __name__ == "__main__":
    manager.run()
