import logging
import flask_migrate
from sqlalchemy import MetaData, inspect
from sqlalchemy.exc import InternalError
from sqlalchemy.dialects.postgresql import ENUM

from aleph.core import db  # noqa
from aleph.model.role import Role  # noqa
from aleph.model.alert import Alert  # noqa
from aleph.model.permission import Permission  # noqa
from aleph.model.entity import Entity  # noqa
from aleph.model.match import Match  # noqa
from aleph.model.collection import Collection  # noqa
from aleph.model.cache import Cache  # noqa
from aleph.model.document import Document  # noqa
from aleph.model.document_record import DocumentRecord  # noqa
from aleph.model.document_tag import DocumentTag, DocumentTagCollector  # noqa
from aleph.model.metadata import Metadata  # noqa
from aleph.model.event import Event, Events  # noqa
from aleph.model.notification import Notification  # noqa
from aleph.model.subscription import Subscription  # noqa
from aleph.model.audit import Audit  # noqa

log = logging.getLogger(__name__)


def upgrade_db():
    log.info("Beginning database migration...")
    flask_migrate.upgrade()
    create_system_roles()


def destroy_db():
    metadata = MetaData()
    metadata.bind = db.engine
    metadata.reflect()
    tables = list(metadata.sorted_tables)
    while len(tables):
        for table in tables:
            try:
                table.drop(checkfirst=True)
                tables.remove(table)
            except InternalError:
                pass
    for enum in inspect(db.engine).get_enums():
        enum = ENUM(name=enum['name'])
        enum.drop(bind=db.engine, checkfirst=True)


def create_system_roles():
    log.info("Creating system roles...")
    Role.load_id(Role.SYSTEM_GUEST, Role.SYSTEM, 'All visitors')
    Role.load_id(Role.SYSTEM_USER, Role.SYSTEM, 'Logged-in users')
    db.session.commit()
