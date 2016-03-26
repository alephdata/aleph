"""begin entity refactor.

Revision ID: 85083a1c9908
Revises: afd5bb9f5004
Create Date: 2016-03-24 16:57:01.303893

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '85083a1c9908'
down_revision = 'afd5bb9f5004'


def upgrade():
    op.drop_constraint('reference_entity_id_fkey', 'reference')
    op.drop_constraint('selector_entity_id_fkey', 'selector')
    op.drop_table('selector')
    op.drop_table('entity')
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    op.execute(meta.tables['reference'].delete())
    op.create_table('entity',
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=255), nullable=True),
        sa.Column('name', sa.Unicode(), nullable=True),
        sa.Column('description', sa.Unicode(), nullable=True),
        sa.Column('image', sa.Unicode(), nullable=True),
        sa.Column('collection_id', sa.Integer(), nullable=True),
        sa.Column('jurisdiction_code', sa.Unicode(), nullable=True),
        sa.Column('register_name', sa.Unicode(), nullable=True),
        sa.Column('summary', sa.Unicode(), nullable=True),
        sa.Column('valuation', sa.Integer(), nullable=True),
        sa.Column('valuation_currency', sa.Unicode(length=100), nullable=True),
        sa.Column('valuation_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collection.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key("reference_entity_id_fkey", "reference", "entity",
                          ["entity_id"], ["id"])


def downgrade():
    op.drop_table('entity')
    op.create_table('entity',
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('foreign_id', sa.Unicode(), nullable=True),
        sa.Column('name', sa.Unicode(), nullable=True),
        sa.Column('data', postgresql.JSONB(), nullable=True),
        sa.Column('category', sa.Enum('Person', 'Company', 'Organization', 'Other',
                                      name='entity_categories'), nullable=False),
        sa.Column('collection_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collection.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_table('selector',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Unicode(), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
