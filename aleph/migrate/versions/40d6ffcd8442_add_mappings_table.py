"""empty message

Revision ID: 40d6ffcd8442
Revises: 8a8ef1f7e6fa
Create Date: 2019-10-02 04:37:55.784441

"""

# revision identifiers, used by Alembic.
revision = '40d6ffcd8442'
down_revision = '8a8ef1f7e6fa'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table('mapping',
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('collection_id', sa.Integer(), nullable=True),
        sa.Column('table_id', sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collection.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mapping_collection_id'), 'mapping', ['collection_id'], unique=False)
    op.create_index(op.f('ix_mapping_role_id'), 'mapping', ['role_id'], unique=False)
    op.create_index(op.f('ix_mapping_table_id'), 'mapping', ['table_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_mapping_table_id'), table_name='mapping')
    op.drop_index(op.f('ix_mapping_role_id'), table_name='mapping')
    op.drop_index(op.f('ix_mapping_collection_id'), table_name='mapping')
    op.drop_table('mapping')
