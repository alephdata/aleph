"""Added credentials.

Revision ID: 2d230e6ce46d
Revises: 294b8f9f9478
Create Date: 2017-01-26 21:42:52.722454

"""

# revision identifiers, used by Alembic.
revision = '2d230e6ce46d'
down_revision = '294b8f9f9478'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

from aleph.core import db
from aleph.model import Role, Credential
from aleph.model.common import make_textid


def upgrade():
    op.execute('create extension pgcrypto')

    op.create_table('credential',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('secret', sa.Unicode(60)),
        sa.Column('reset_token', sa.Unicode(32)),
        sa.Column(
            'foreign_id',
            sa.Unicode(length=2048),
            nullable=False,
            unique=True
        ),
        sa.Column(
            'source',
            sa.Enum(*Credential.SOURCES, name='credential_source'),
            nullable=False
        ),

        sa.Column('role_id', sa.Integer()),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(
        op.f('credential_reset_token'),
        'credential',
        ['reset_token'],
        unique=True
    )
    op.create_index(
        op.f('credential_role_id'),
        'credential',
        ['role_id'],
        unique=False
    )

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    role_table = meta.tables['role']
    creds_table = meta.tables['credential']

    credentials = []
    roles_query = sa.select([role_table]).where(role_table.c.type == 'user')

    for role in bind.execute(roles_query).fetchall():
        credentials.append(
            dict(
                id=make_textid(),
                role_id=role.id,
                foreign_id=role.foreign_id,
                source=Credential.OAUTH,
                created_at=role.created_at,
            )
        )

    op.bulk_insert(creds_table, credentials)
    op.drop_column('role', 'foreign_id')


def downgrade():
    pass
