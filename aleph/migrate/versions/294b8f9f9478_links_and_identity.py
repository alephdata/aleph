"""links and identity

Revision ID: 294b8f9f9478
Revises: b57676ef5bc5
Create Date: 2016-12-23 12:40:03.317807

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '294b8f9f9478'
down_revision = 'b57676ef5bc5'


def upgrade():
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    table = meta.tables['entity_identity']
    bind.execute(table.delete())

    op.drop_column(u'collection', 'generate_entities')

    op.create_table('link',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('type', sa.String(length=255), nullable=True),
        sa.Column('source_id', sa.String(length=254), nullable=True),
        sa.Column('target_id', sa.String(length=254), nullable=True),
        sa.Column('foreign_ids', postgresql.ARRAY(sa.Unicode()), nullable=True),
        sa.Column('data', postgresql.JSONB(), nullable=True),
        sa.Column('collection_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collection.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(op.f('ix_link_collection_id'), 'link', ['collection_id'], unique=False)
    op.create_index(op.f('ix_link_source_id'), 'link', ['source_id'], unique=False)
    op.create_index(op.f('ix_link_target_id'), 'link', ['target_id'], unique=False)
    op.create_index(op.f('ix_link_type'), 'link', ['type'], unique=False)

    op.add_column(u'entity_identity', sa.Column('match_id', sa.String(length=254), nullable=False))
    op.add_column(u'entity_identity', sa.Column('judge_id', sa.Integer(), nullable=True))
    op.add_column(u'entity_identity', sa.Column('judgement', sa.Integer(), nullable=False))
    op.create_index(op.f('ix_entity_identity_match_id'), 'entity_identity', ['match_id'], unique=False)
    op.drop_index('ix_entity_identity_identity', table_name='entity_identity')
    op.create_foreign_key(None, 'entity_identity', 'entity', ['entity_id'], ['id'])
    op.create_foreign_key(None, 'entity_identity', 'role', ['judge_id'], ['id'])
    op.drop_column(u'entity_identity', 'identity')


def downgrade():
    pass
