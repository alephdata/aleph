import logging
from flask.ext import migrate

from aleph.core import db # noqa
from aleph.model.role import Role # noqa
from aleph.model.alert import Alert # noqa
from aleph.model.permission import Permission # noqa
from aleph.model.source import Source # noqa
from aleph.model.entity import Entity, Selector # noqa
from aleph.model.reference import Reference # noqa
from aleph.model.collection import Collection # noqa
from aleph.model.log import ProcessingLog # noqa
from aleph.model.metadata import Metadata # noqa
from aleph.model.document import Document, DocumentPage # noqa
from aleph.model.validation import validate # noqa

log = logging.getLogger(__name__)


def clear_session():
    db.session.rollback()
    # db.session.remove()
    # db.session.expunge_all()
    # db.session.prune()


def upgrade_db():
    log.info("Beginning database migration...")
    migrate.upgrade()
    create_system_roles


def create_system_roles():
    log.info("Creating system roles...")
    Role.load_or_create(Role.SYSTEM_GUEST, Role.SYSTEM, 'All visitors')
    Role.load_or_create(Role.SYSTEM_USER, Role.SYSTEM, 'Logged-in users')
    db.session.commit()
