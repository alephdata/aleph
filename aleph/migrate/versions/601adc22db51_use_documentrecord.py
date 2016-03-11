"""use documentrecord

Revision ID: 601adc22db51
Revises: e34d28e9a167
Create Date: 2016-03-10 22:01:12.981702

"""

# revision identifiers, used by Alembic.
revision = '601adc22db51'
down_revision = 'e34d28e9a167'

import logging
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

log = logging.getLogger(__name__)


def upgrade():
    op.create_table('document_record',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('sheet', sa.Integer(), nullable=False),
        sa.Column('row_id', sa.Integer(), nullable=False),
        sa.Column('data', postgresql.JSONB(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['document.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    documents = meta.tables['document']
    records = meta.tables['document_record']
    for name, table in meta.tables.items():
        if not name.startswith('tabular_'):
            continue
        _, doc_hash, sheet = name.split('_')
        q = sa.select([documents]).where(documents.c.content_hash == doc_hash)
        rp = bind.execute(q)
        for doc in rp.fetchall():
            log.info("Copy records from %r to doc %s", name, doc.id)
            irp = bind.execute(sa.select([table]))
            while True:
                rows = irp.fetchmany(1000)
                if not len(rows):
                    break
                inserts = []
                for row in rows:
                    row = dict(row)
                    row_id = row.pop('_id')
                    inserts.append({
                        'document_id': doc.id,
                        'sheet': int(sheet),
                        'row_id': row_id,
                        'data': row
                    })
                bind.execute(records.insert(), inserts)
    op.create_index(op.f('ix_document_record_doc'), 'document_record',
                    ['document_id'], unique=False)


def downgrade():
    op.drop_table('document_record')
