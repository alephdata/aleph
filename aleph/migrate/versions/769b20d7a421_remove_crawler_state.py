"""Remove crawler state.

Revision ID: 769b20d7a421
Revises: 2d230e6ce46d
Create Date: 2017-02-23 17:59:29.912271

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '769b20d7a421'
down_revision = '2d230e6ce46d'


def upgrade():
    op.drop_table('crawler_state')
    op.add_column('document', sa.Column('crawler', sa.Unicode(), nullable=True))
    op.add_column('document', sa.Column('crawler_run', sa.Unicode(), nullable=True))
    op.add_column('document', sa.Column('error_details', sa.Unicode(), nullable=True))
    op.add_column('document', sa.Column('error_message', sa.Unicode(), nullable=True))
    op.add_column('document', sa.Column('error_type', sa.Unicode(), nullable=True))
    op.add_column('document', sa.Column('status', sa.Unicode(length=10), nullable=True))
    op.create_index(op.f('ix_document_crawler'), 'document', ['crawler'], unique=False)
    op.create_index(op.f('ix_document_status'), 'document', ['status'], unique=False)

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    document_table = meta.tables['document']
    q = sa.update(document_table)
    q = q.values(status='success')
    bind.execute(q)


def downgrade():
    pass
