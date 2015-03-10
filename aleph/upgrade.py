import logging
from flask.ext import migrate

from aleph.search import init_search, delete_index
from aleph.model import db, Source


log = logging.getLogger(__name__)


def upgrade():
    log.info("Beginning database migration...")
    migrate.upgrade()
    log.info("Reconfiguring the search index...")
    init_search()
    Source.sync()


def reset():
    db.drop_all()
    delete_index()
    upgrade()
