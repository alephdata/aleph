"""adjunct entity objects

Revision ID: fa7c1ccb0ac9
Revises: 85083a1c9908
Create Date: 2016-03-30 12:19:02.512747

"""

# revision identifiers, used by Alembic.
revision = 'fa7c1ccb0ac9'
down_revision = '85083a1c9908'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table('entity_address',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('text', sa.Unicode(), nullable=True),
    sa.Column('street_address', sa.Unicode(), nullable=True),
    sa.Column('locality', sa.Unicode(), nullable=True),
    sa.Column('region', sa.Unicode(), nullable=True),
    sa.Column('postal_code', sa.Unicode(), nullable=True),
    sa.Column('country', sa.Unicode(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('entity_contact_detail',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('entity_id', sa.Integer(), nullable=True),
    sa.Column('label', sa.Unicode(), nullable=True),
    sa.Column('type', sa.Unicode(), nullable=True),
    sa.Column('note', sa.Unicode(), nullable=True),
    sa.Column('valid_from', sa.DateTime(), nullable=True),
    sa.Column('valid_until', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entity_contact_detail_entity_id'), 'entity_contact_detail', ['entity_id'], unique=False)
    op.create_table('entity_identifier',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('entity_id', sa.Integer(), nullable=True),
    sa.Column('identifier', sa.Unicode(), nullable=True),
    sa.Column('scheme', sa.Unicode(), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entity_identifier_entity_id'), 'entity_identifier', ['entity_id'], unique=False)
    op.create_table('entity_other_name',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('deleted_at', sa.DateTime(), nullable=True),
    sa.Column('entity_id', sa.Integer(), nullable=True),
    sa.Column('name', sa.Unicode(), nullable=True),
    sa.Column('note', sa.Unicode(), nullable=True),
    sa.Column('family_name', sa.Unicode(), nullable=True),
    sa.Column('given_name', sa.Unicode(), nullable=True),
    sa.Column('additional_name', sa.Unicode(), nullable=True),
    sa.Column('start_date', sa.DateTime(), nullable=True),
    sa.Column('end_date', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_entity_other_name_entity_id'), 'entity_other_name', ['entity_id'], unique=False)
    op.add_column(u'entity', sa.Column('biography', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('birth_date', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('building_address_id', sa.Integer(), nullable=True))
    op.add_column(u'entity', sa.Column('classification', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('company_number', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('company_type', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('current_status', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('death_date', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.add_column(u'entity', sa.Column('dissolution_date', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('founding_date', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('gender', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('headquarters_address_id', sa.Integer(), nullable=True))
    op.add_column(u'entity', sa.Column('parcel_area', sa.Integer(), nullable=True))
    op.add_column(u'entity', sa.Column('parcel_area_units', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('parcel_name', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('parcel_number', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('postal_address_id', sa.Integer(), nullable=True))
    op.add_column(u'entity', sa.Column('register_url', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('registered_address_id', sa.Integer(), nullable=True))
    op.add_column(u'entity', sa.Column('residential_address_id', sa.Integer(), nullable=True))
    op.add_column(u'entity', sa.Column('sector', sa.Date(), nullable=True))
    op.add_column(u'entity', sa.Column('usage_code', sa.Unicode(), nullable=True))
    op.add_column(u'entity', sa.Column('usage_name', sa.Unicode(), nullable=True))
    op.create_index(op.f('ix_entity_type'), 'entity', ['type'], unique=False)
    op.create_foreign_key(None, 'entity', 'entity_address', ['building_address_id'], ['id'])
    op.create_foreign_key(None, 'entity', 'entity_address', ['residential_address_id'], ['id'])
    op.create_foreign_key(None, 'entity', 'entity_address', ['postal_address_id'], ['id'])
    op.create_foreign_key(None, 'entity', 'entity_address', ['registered_address_id'], ['id'])
    op.create_foreign_key(None, 'entity', 'entity_address', ['headquarters_address_id'], ['id'])


def downgrade():
    op.drop_constraint(None, 'entity', type_='foreignkey')
    op.drop_constraint(None, 'entity', type_='foreignkey')
    op.drop_constraint(None, 'entity', type_='foreignkey')
    op.drop_constraint(None, 'entity', type_='foreignkey')
    op.drop_constraint(None, 'entity', type_='foreignkey')
    op.drop_index(op.f('ix_entity_type'), table_name='entity')
    op.drop_column(u'entity', 'usage_name')
    op.drop_column(u'entity', 'usage_code')
    op.drop_column(u'entity', 'sector')
    op.drop_column(u'entity', 'residential_address_id')
    op.drop_column(u'entity', 'registered_address_id')
    op.drop_column(u'entity', 'register_url')
    op.drop_column(u'entity', 'postal_address_id')
    op.drop_column(u'entity', 'parcel_number')
    op.drop_column(u'entity', 'parcel_name')
    op.drop_column(u'entity', 'parcel_area_units')
    op.drop_column(u'entity', 'parcel_area')
    op.drop_column(u'entity', 'headquarters_address_id')
    op.drop_column(u'entity', 'gender')
    op.drop_column(u'entity', 'founding_date')
    op.drop_column(u'entity', 'dissolution_date')
    op.drop_column(u'entity', 'deleted_at')
    op.drop_column(u'entity', 'death_date')
    op.drop_column(u'entity', 'current_status')
    op.drop_column(u'entity', 'company_type')
    op.drop_column(u'entity', 'company_number')
    op.drop_column(u'entity', 'classification')
    op.drop_column(u'entity', 'building_address_id')
    op.drop_column(u'entity', 'birth_date')
    op.drop_column(u'entity', 'biography')
    op.drop_index(op.f('ix_entity_other_name_entity_id'), table_name='entity_other_name')
    op.drop_table('entity_other_name')
    op.drop_index(op.f('ix_entity_identifier_entity_id'), table_name='entity_identifier')
    op.drop_table('entity_identifier')
    op.drop_index(op.f('ix_entity_contact_detail_entity_id'), table_name='entity_contact_detail')
    op.drop_table('entity_contact_detail')
    op.drop_table('entity_address')
