"""Make entity data stored in JSONB.

Revision ID: aca5ebda9763
Revises: ae4b1cec6294
Create Date: 2016-11-21 18:48:40.063620

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'aca5ebda9763'
down_revision = 'ae4b1cec6294'

SKIP_COLUMNS = ['id', 'updated_at', 'created_at', 'entity_id']


def clean_data(row):
    data = {}
    for k, v in row.items():
        if k in SKIP_COLUMNS:
            continue
        if v is not None:
            data[k] = v
    return data


def upgrade():
    op.add_column('entity', sa.Column('data', postgresql.JSONB(), nullable=True))
    op.add_column('entity', sa.Column('identifiers', postgresql.ARRAY(sa.Unicode()), nullable=True))
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    entity_table = meta.tables['entity']
    entity_other_name_table = meta.tables['entity_other_name']
    entity_identifiers_table = meta.tables['entity_identifier']
    rp = bind.execute(sa.select([entity_table]))
    while True:
        entity = rp.fetchone()
        if entity is None:
            break

        data = {
            'identifiers': [],
            'other_names': []
        }
        data.update(clean_data(entity))
        data.pop('name', None)
        data.pop('type', None)
        data.pop('state', None)
        data.pop('deleted_at', None)

        q = sa.select([entity_other_name_table])
        q = q.where(entity_other_name_table.c.entity_id == entity.id)
        for row in bind.execute(q).fetchall():
            row = clean_data(row)
            if not row.get('deleted_at'):
                data['other_names'].append(row)

        identifiers = []
        q = sa.select([entity_identifiers_table])
        q = q.where(entity_identifiers_table.c.entity_id == entity.id)
        for row in bind.execute(q).fetchall():
            row = clean_data(row)
            if not row.get('deleted_at'):
                data['identifiers'].append(row)
                ident = '%(scheme)s:%(identifier)s' % row
                identifiers.append(ident)

        q = sa.update(entity_table).where(entity_table.c.id == entity.id)
        q = q.values(data=data, identifiers=identifiers)
        bind.execute(q)
        # from pprint import pprint
        # pprint(data)


def downgrade():
    op.drop_column('entity', 'identifiers')
    op.drop_column('entity', 'data')
    