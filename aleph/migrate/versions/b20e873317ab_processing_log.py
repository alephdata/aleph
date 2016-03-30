"""Processing log.

Revision ID: b20e873317ab
Revises: 0910f8c739af
Create Date: 2016-03-22 18:08:14.331374

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b20e873317ab'
down_revision = '0910f8c739af'


def upgrade():
    op.create_table('processing_log', # noqa
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('operation', sa.Unicode(), nullable=True),
        sa.Column('component', sa.Unicode(), nullable=True),
        sa.Column('source_location', sa.Unicode(), nullable=True),
        sa.Column('content_hash', sa.Unicode(length=65), nullable=True),
        sa.Column('foreign_id', sa.Unicode(), nullable=True),
        sa.Column('source_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.BigInteger(), nullable=True),
        sa.Column('meta', postgresql.JSONB(), nullable=True),
        sa.Column('error_type', sa.Unicode(), nullable=True),
        sa.Column('error_message', sa.Unicode(), nullable=True),
        sa.Column('error_details', sa.Unicode(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_processing_log_component'), 'processing_log',
                    ['component'], unique=False)
    op.create_index(op.f('ix_processing_log_content_hash'), 'processing_log',
                    ['content_hash'], unique=False)
    op.create_index(op.f('ix_processing_log_operation'), 'processing_log',
                    ['operation'], unique=False)
    op.create_index(op.f('ix_processing_log_source_loc'), 'processing_log',
                    ['source_location'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_processing_log_source_location'),
                  table_name='processing_log')
    op.drop_index(op.f('ix_processing_log_operation'),
                  table_name='processing_log')
    op.drop_index(op.f('ix_processing_log_content_hash'),
                  table_name='processing_log')
    op.drop_index(op.f('ix_processing_log_component'),
                  table_name='processing_log')
    op.drop_table('processing_log')
