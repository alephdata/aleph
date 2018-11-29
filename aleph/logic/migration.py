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
