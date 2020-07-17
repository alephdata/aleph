"""entity recreate.

Revision ID: cc03d89e76c8
Revises: 4f5eb9113692
Create Date: 2016-04-14 14:24:08.804039

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "cc03d89e76c8"
down_revision = "4f5eb9113692"


def upgrade():
    op.create_table(
        "entity_address",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("text", sa.Unicode(), nullable=True),
        sa.Column("street_address", sa.Unicode(), nullable=True),
        sa.Column("locality", sa.Unicode(), nullable=True),
        sa.Column("region", sa.Unicode(), nullable=True),
        sa.Column("postal_code", sa.Unicode(), nullable=True),
        sa.Column("country", sa.Unicode(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "entity",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("name", sa.Unicode(), nullable=True),
        sa.Column("type", sa.String(length=255), nullable=True),
        sa.Column("summary", sa.Unicode(), nullable=True),
        sa.Column("description", sa.Unicode(), nullable=True),
        sa.Column("jurisdiction_code", sa.Unicode(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.Column("register_name", sa.Unicode(), nullable=True),
        sa.Column("valuation", sa.Integer(), nullable=True),
        sa.Column("valuation_currency", sa.Unicode(length=100), nullable=True),
        sa.Column("valuation_date", sa.Date(), nullable=True),
        sa.Column("image", sa.Unicode(), nullable=True),
        sa.Column("postal_address_id", sa.String(length=32), nullable=True),
        sa.Column("parcel_number", sa.Unicode(), nullable=True),
        sa.Column("parcel_name", sa.Unicode(), nullable=True),
        sa.Column("parcel_area", sa.Integer(), nullable=True),
        sa.Column("parcel_area_units", sa.Unicode(), nullable=True),
        sa.Column("usage_code", sa.Unicode(), nullable=True),
        sa.Column("usage_name", sa.Unicode(), nullable=True),
        sa.Column("building_address_id", sa.String(length=32), nullable=True),
        sa.Column("gender", sa.Unicode(), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("death_date", sa.Date(), nullable=True),
        sa.Column("biography", sa.Unicode(), nullable=True),
        sa.Column("residential_address_id", sa.String(length=32), nullable=True),
        sa.Column("classification", sa.Unicode(), nullable=True),
        sa.Column("founding_date", sa.Date(), nullable=True),
        sa.Column("dissolution_date", sa.Date(), nullable=True),
        sa.Column("current_status", sa.Unicode(), nullable=True),
        sa.Column("registered_address_id", sa.String(length=32), nullable=True),
        sa.Column("headquarters_address_id", sa.String(length=32), nullable=True),
        sa.Column("company_number", sa.Unicode(), nullable=True),
        sa.Column("sector", sa.Unicode(), nullable=True),
        sa.Column("company_type", sa.Unicode(), nullable=True),
        sa.Column("register_url", sa.Unicode(), nullable=True),
        sa.ForeignKeyConstraint(["building_address_id"], ["entity_address.id"]),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["headquarters_address_id"], ["entity_address.id"],),
        sa.ForeignKeyConstraint(["postal_address_id"], ["entity_address.id"],),
        sa.ForeignKeyConstraint(["registered_address_id"], ["entity_address.id"],),
        sa.ForeignKeyConstraint(["residential_address_id"], ["entity_address.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_entity_type"), "entity", ["type"], unique=False)
    op.create_table(
        "entity_contact_detail",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("entity_id", sa.String(length=32), nullable=True),
        sa.Column("label", sa.Unicode(), nullable=True),
        sa.Column("type", sa.Unicode(), nullable=True),
        sa.Column("note", sa.Unicode(), nullable=True),
        sa.Column("valid_from", sa.DateTime(), nullable=True),
        sa.Column("valid_until", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["entity_id"], ["entity.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entity_contact_detail_entity_id"),
        "entity_contact_detail",
        ["entity_id"],
        unique=False,
    )
    op.create_table(
        "entity_identifier",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("entity_id", sa.String(length=32), nullable=True),
        sa.Column("identifier", sa.Unicode(), nullable=True),
        sa.Column("scheme", sa.Unicode(), nullable=True),
        sa.ForeignKeyConstraint(["entity_id"], ["entity.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entity_identifier_entity_id"),
        "entity_identifier",
        ["entity_id"],
        unique=False,
    )
    op.create_table(
        "entity_other_name",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("entity_id", sa.String(length=32), nullable=True),
        sa.Column("name", sa.Unicode(), nullable=True),
        sa.Column("note", sa.Unicode(), nullable=True),
        sa.Column("family_name", sa.Unicode(), nullable=True),
        sa.Column("given_name", sa.Unicode(), nullable=True),
        sa.Column("additional_name", sa.Unicode(), nullable=True),
        sa.Column("honorific_prefix", sa.Unicode(), nullable=True),
        sa.Column("honorific_suffix", sa.Unicode(), nullable=True),
        sa.Column("patronymic_name", sa.Unicode(), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=True),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["entity_id"], ["entity.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entity_other_name_entity_id"),
        "entity_other_name",
        ["entity_id"],
        unique=False,
    )
    op.drop_index("ix_document_record_doc", table_name="document_record")
    op.create_index(
        op.f("ix_processing_log_source_location"),
        "processing_log",
        ["source_location"],
        unique=False,
    )
    op.drop_index("ix_processing_log_source_loc", table_name="processing_log")
    op.add_column(
        "reference", sa.Column("entity_id", sa.String(length=32), nullable=True)
    )
    op.create_foreign_key(
        "ix_reference_fk", "reference", "entity", ["entity_id"], ["id"]
    )


def downgrade():
    op.drop_constraint("ix_reference_fk", "reference", type_="foreignkey")
    op.drop_column("reference", "entity_id")
    op.create_index(
        "ix_processing_log_source_loc",
        "processing_log",
        ["source_location"],
        unique=False,
    )
    op.drop_index(
        op.f("ix_processing_log_source_location"), table_name="processing_log"
    )
    op.create_index(
        "ix_document_record_doc", "document_record", ["document_id"], unique=False
    )
    op.drop_index(
        op.f("ix_entity_other_name_entity_id"), table_name="entity_other_name"
    )
    op.drop_table("entity_other_name")
    op.drop_index(
        op.f("ix_entity_identifier_entity_id"), table_name="entity_identifier"
    )
    op.drop_table("entity_identifier")
    op.drop_index(
        op.f("ix_entity_contact_detail_entity_id"), table_name="entity_contact_detail"
    )
    op.drop_table("entity_contact_detail")
    op.drop_index(op.f("ix_entity_type"), table_name="entity")
    op.drop_table("entity")
    op.drop_table("entity_address")
