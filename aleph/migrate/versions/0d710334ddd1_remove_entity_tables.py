"""remove entity tables

Revision ID: 0d710334ddd1
Revises: aca5ebda9763
Create Date: 2016-11-21 21:42:28.617891

"""
from alembic import op
# import sqlalchemy as sa
# from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0d710334ddd1'
down_revision = 'aca5ebda9763'


def upgrade():
    op.drop_constraint(u'entity_building_address_id_fkey', 'entity', type_='foreignkey')
    op.drop_constraint(u'entity_headquarters_address_id_fkey', 'entity', type_='foreignkey')
    op.drop_constraint(u'entity_postal_address_id_fkey', 'entity', type_='foreignkey')
    op.drop_constraint(u'entity_registered_address_id_fkey', 'entity', type_='foreignkey')
    op.drop_constraint(u'entity_residential_address_id_fkey', 'entity', type_='foreignkey')
    op.drop_table('entity_contact_detail')
    op.drop_table('entity_identifier')
    op.drop_table('entity_address')
    op.drop_table('entity_other_name')
    op.drop_column('entity', 'dissolution_date')
    op.drop_column('entity', 'sector')
    op.drop_column('entity', 'death_date')
    op.drop_column('entity', 'register_url')
    op.drop_column('entity', 'classification')
    op.drop_column('entity', 'image')
    op.drop_column('entity', 'company_type')
    op.drop_column('entity', 'register_name')
    op.drop_column('entity', 'usage_name')
    op.drop_column('entity', 'parcel_name')
    op.drop_column('entity', 'jurisdiction_code')
    op.drop_column('entity', 'valuation_date')
    op.drop_column('entity', 'residential_address_id')
    op.drop_column('entity', 'usage_code')
    op.drop_column('entity', 'parcel_area')
    op.drop_column('entity', 'registered_address_id')
    op.drop_column('entity', 'building_address_id')
    op.drop_column('entity', 'postal_address_id')
    op.drop_column('entity', 'parcel_area_units')
    op.drop_column('entity', 'description')
    op.drop_column('entity', 'birth_date')
    op.drop_column('entity', 'valuation')
    op.drop_column('entity', 'founding_date')
    op.drop_column('entity', 'gender')
    op.drop_column('entity', 'valuation_currency')
    op.drop_column('entity', 'company_number')
    op.drop_column('entity', 'current_status')
    op.drop_column('entity', 'summary')
    op.drop_column('entity', 'parcel_number')
    op.drop_column('entity', 'headquarters_address_id')
    op.drop_column('entity', 'identifiers')


def downgrade():
    pass
