from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from flask.ext.migrate import MigrateCommand

from aleph.model import db
from aleph.views import app, assets
from aleph.processing import process_collection
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
    db.session.commit()


@manager.command
def process(source_key, force=False):
    """ Index all documents in the given source. """
    process_collection.delay(source_key, overwrite=force)


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
