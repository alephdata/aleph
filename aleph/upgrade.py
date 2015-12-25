import logging
from flask.ext import migrate

from aleph.index import init_search, delete_index
from aleph.model import db


log = logging.getLogger(__name__)


def upgrade():
    log.info("Beginning database migration...")
    migrate.upgrade()
    log.info("Reconfiguring the search index...")
    init_search()


def reset():
    db.drop_all()
    delete_index()
    upgrade()
