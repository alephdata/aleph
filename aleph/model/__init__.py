import logging
from flask.ext import migrate

from aleph.core import db # noqa
from aleph.model.role import Role # noqa
from aleph.model.alert import Alert # noqa
from aleph.model.permission import Permission # noqa
from aleph.model.source import Source # noqa
from aleph.model.entity import Entity, Selector # noqa
from aleph.model.reference import Reference # noqa
from aleph.model.watchlist import Watchlist # noqa
from aleph.model.metadata import Metadata # noqa
from aleph.model.document import Document, DocumentPage # noqa

log = logging.getLogger(__name__)


def clear_session():
    db.session.rollback()
    # db.session.expunge_all()
    # db.session.prune()


def upgrade_db():
    log.info("Beginning database migration...")
    # print [migrate.current()]
    migrate.upgrade()
