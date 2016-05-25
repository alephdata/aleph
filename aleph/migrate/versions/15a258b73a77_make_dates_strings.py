"""Make dates strings.

Revision ID: 15a258b73a77
Revises: 29cad4a9684a
Create Date: 2016-05-25 20:54:33.496058

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '15a258b73a77'
down_revision = '29cad4a9684a'

COLUMNS = [('entity', 'valuation_date'),
           ('entity', 'birth_date'),
           ('entity', 'death_date'),
           ('entity', 'founding_date'),
           ('entity', 'dissolution_date'),
           ('entity_other_name', 'start_date'),
           ('entity_other_name', 'end_date'),
           ('entity_contact_detail', 'valid_from'),
           ('entity_contact_detail', 'valid_until')]


def upgrade():
    for (table, column) in COLUMNS:
        q = "ALTER TABLE %s ALTER COLUMN %s TYPE VARCHAR" % (table, column)
        op.execute(q)


def downgrade():
    pass
