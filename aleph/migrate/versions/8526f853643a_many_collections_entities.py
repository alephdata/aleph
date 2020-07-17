"""many-to-many relationship between collections and entities

Revision ID: 8526f853643a
Revises: cc03d89e76c8
Create Date: 2016-05-02 12:31:12.457470

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8526f853643a"
down_revision = "cc03d89e76c8"


def upgrade():
    op.create_table(
        "collection_entity",
        sa.Column("entity_id", sa.String(length=32), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["entity_id"], ["entity.id"],),
    )  # noqa
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    entity_table = meta.tables["entity"]
    collection_entity_table = meta.tables["collection_entity"]
    rp = bind.execute(sa.select([entity_table]))
    for ent in rp.fetchall():
        if ent["collection_id"] is None:
            continue
        q = collection_entity_table.insert(
            {"entity_id": ent["id"], "collection_id": ent["collection_id"]}
        )
        bind.execute(q)
    op.drop_constraint("entity_collection_id_fkey", "entity", type_="foreignkey")
    op.drop_column("entity", "collection_id")


def downgrade():
    op.add_column(
        "entity",
        sa.Column("collection_id", sa.INTEGER(), autoincrement=False, nullable=True),
    )  # noqa
    op.create_foreign_key(
        "entity_collection_id_fkey", "entity", "collection", ["collection_id"], ["id"]
    )  # noqa
    op.drop_table("collection_entity")
