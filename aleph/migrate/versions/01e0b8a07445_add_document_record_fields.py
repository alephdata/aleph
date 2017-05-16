"""Add document_record fields for text and index.

Revision ID: 01e0b8a07445
Revises: 769b20d7a421
Create Date: 2017-05-15 18:27:26.769574

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '01e0b8a07445'
down_revision = '769b20d7a421'


def upgrade():
    op.add_column('document_record', sa.Column('index', sa.Integer(), nullable=True))
    op.add_column('document_record', sa.Column('text', sa.Unicode(), nullable=True))
    op.alter_column('document_record', 'sheet', existing_type=sa.INTEGER(), nullable=True)
    op.alter_column('document_record', 'row_id', existing_type=sa.INTEGER(), nullable=True)
    op.create_index(op.f('ix_document_record_document_id'), 'document_record', ['document_id'], unique=False)

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    records = meta.tables['document_record']
    bind.execute(sa.update(records).values(index=records.c.row_id))
    pages = meta.tables['document_page']
    q = sa.select([pages.c.number, pages.c.text, pages.c.document_id], from_obj=pages)
    q = sa.insert(records).from_select([records.c.index, records.c.text, records.c.document_id], q)
    bind.execute(q)


def downgrade():
    pass
