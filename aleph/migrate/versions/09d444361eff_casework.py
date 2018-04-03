"""Basics of the case work system discussed in #334.

Revision ID: 09d444361eff
Revises: ff8e10fe44d7
Create Date: 2018-04-03 05:17:59.869686

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '09d444361eff'
down_revision = 'ff8e10fe44d7'


def upgrade():
    op.create_table('dossier_match',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('entity_id', sa.String(length=42), nullable=True),
        sa.Column('dossier_id', sa.String(length=42), nullable=True),
        sa.Column('match', sa.Boolean(), nullable=True),
        sa.Column('decided', sa.Boolean(), nullable=True),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dossier_match_dossier_id'), 'dossier_match', ['dossier_id'], unique=False)
    op.create_index(op.f('ix_dossier_match_entity_id'), 'dossier_match', ['entity_id'], unique=False)
    op.create_table('dossier_link',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('text', sa.Unicode(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.Unicode()), nullable=True),
        sa.Column('dossier_id', sa.String(length=42), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('collection_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collection.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dossier_link_collection_id'), 'dossier_link', ['collection_id'], unique=False)
    op.create_index(op.f('ix_dossier_link_dossier_id'), 'dossier_link', ['dossier_id'], unique=False)
    op.add_column(u'entity', sa.Column('foreign_id', sa.Unicode(), nullable=True))
    op.drop_column(u'entity', 'foreign_ids')

    op.add_column(u'collection', sa.Column('casefile', sa.Boolean(), nullable=True))
    op.add_column(u'collection', sa.Column('data_url', sa.Unicode(), nullable=True))
    op.add_column(u'collection', sa.Column('info_url', sa.Unicode(), nullable=True))
    op.add_column(u'collection', sa.Column('publisher', sa.Unicode(), nullable=True))
    op.add_column(u'collection', sa.Column('publisher_url', sa.Unicode(), nullable=True))

    bind = op.get_bind()
    bind.execute("UPDATE collection SET casefile = NOT managed;")

    op.drop_column(u'collection', 'managed')


def downgrade():
    pass
