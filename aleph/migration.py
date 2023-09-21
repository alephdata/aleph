import flask_migrate
from sqlalchemy import MetaData, inspect
from sqlalchemy.exc import InternalError
from sqlalchemy.dialects.postgresql import ENUM

from aleph.core import db, archive
from aleph.logic.roles import create_system_roles
from aleph.index.admin import upgrade_search


def upgrade_system():
    flask_migrate.upgrade()
    archive.upgrade()
    create_system_roles()
    upgrade_search()


def cleanup_deleted():
    from aleph.model import Collection, Role
    from aleph.model import EntitySet, EntitySetItem

    EntitySetItem.cleanup_deleted()
    EntitySet.cleanup_deleted()
    Collection.cleanup_deleted()
    Role.cleanup_deleted()
    db.session.commit()


def destroy_db():
    metadata = MetaData()
    metadata.bind = db.engine
    metadata.reflect(db.engine)
    tables = list(metadata.sorted_tables)
    while len(tables):
        for table in tables:
            try:
                table.drop(checkfirst=True)
                tables.remove(table)
            except InternalError:
                pass
    for enum in inspect(db.engine).get_enums():
        enum = ENUM(name=enum["name"])
        enum.drop(bind=db.engine, checkfirst=True)
