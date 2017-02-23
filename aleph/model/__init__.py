import logging
import flask_migrate

from aleph.core import db  # noqa
from aleph.model.role import Role  # noqa
from aleph.model.alert import Alert  # noqa
from aleph.model.permission import Permission  # noqa
from aleph.model.entity import Entity  # noqa
from aleph.model.entity_identity import EntityIdentity  # noqa
from aleph.model.link import Link  # noqa
from aleph.model.reference import Reference  # noqa
from aleph.model.collection import Collection  # noqa
from aleph.model.cache import Cache  # noqa
from aleph.model.event_log import EventLog  # noqa
from aleph.model.document import Document, DocumentPage, DocumentRecord  # noqa

log = logging.getLogger(__name__)


def upgrade_db():
    log.info("Beginning database migration...")
    flask_migrate.upgrade()
    create_system_roles()


def create_system_roles():
    log.info("Creating system roles...")
    Role.load_id(Role.SYSTEM_GUEST, Role.SYSTEM, 'All visitors')
    Role.load_id(Role.SYSTEM_USER, Role.SYSTEM, 'Logged-in users')
    db.session.commit()
