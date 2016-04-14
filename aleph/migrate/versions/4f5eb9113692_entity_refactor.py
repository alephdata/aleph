"""entity drop.

Revision ID: 4f5eb9113692
Revises: afd5bb9f5004
Create Date: 2016-04-14 14:19:37.177074

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4f5eb9113692'
down_revision = 'afd5bb9f5004'


def upgrade():
    op.drop_constraint('reference_entity_id_fkey', 'reference')
    op.drop_constraint('selector_entity_id_fkey', 'selector')
    op.drop_table('selector')
    op.drop_table('entity')
    op.drop_column('reference', 'entity_id')


def downgrade():
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
