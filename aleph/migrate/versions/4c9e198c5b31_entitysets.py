"""EntitySets

Revision ID: 4c9e198c5b31
Revises: 8dff301e1b1f
Create Date: 2020-07-01 20:00:00.225223

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "4c9e198c5b31"
down_revision = "8dff301e1b1f"


def upgrade():
    op.create_table(
        "entityset",
        sa.Column("created_at", sa.DateTime(), nullable=False),  # noqa
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.String(length=128), nullable=False),
        sa.Column("label", sa.Unicode(), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("summary", sa.Unicode(), nullable=True),
        sa.Column(
            "layout", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),  # noqa
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=False),
        sa.Column("parent_id", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"]),
        sa.ForeignKeyConstraint(["parent_id"], ["entityset.id"]),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entityset_collection_id"), "entityset", ["collection_id"], unique=False
    )
    op.create_index(
        op.f("ix_entityset_role_id"), "entityset", ["role_id"], unique=False
    )
    op.create_index(op.f("ix_entityset_type"), "entityset", ["type"], unique=False)
    op.create_table(
        "entityset_item",
        sa.Column("created_at", sa.DateTime(), nullable=True),  # noqa
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entityset_id", sa.String(length=128), nullable=True),
        sa.Column("entity_id", sa.String(length=128), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"]),
        sa.ForeignKeyConstraint(["entityset_id"], ["entityset.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entityset_item_collection_id"),
        "entityset_item",
        ["collection_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_entityset_item_entity_id"),
        "entityset_item",
        ["entity_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_entityset_item_entityset_id"),
        "entityset_item",
        ["entityset_id"],
        unique=False,
    )

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect(bind=bind)
    diagram_table = meta.tables["diagram"]
    entityset_table = meta.tables["entityset"]
    item_table = meta.tables["entityset_item"]

    q = sa.select(diagram_table)
    rp = bind.execute(q)
    while True:
        diagram = rp.fetchone()
        if diagram is None:
            break
        q = sa.insert(entityset_table)
        q = q.values(
            {
                "id": str(diagram.id),
                "type": "diagram",
                "label": diagram.label,
                "summary": diagram.summary,
                "role_id": diagram.role_id,
                "collection_id": diagram.collection_id,
                "updated_at": diagram.updated_at,
                "created_at": diagram.created_at,
                "layout": diagram.layout,
            }
        )
        bind.execute(q)
        for entity_id in diagram.entities:
            q = sa.insert(item_table)
            q = q.values(
                {
                    "entityset_id": str(diagram.id),
                    "entity_id": entity_id,
                    "collection_id": diagram.collection_id,
                    "updated_at": diagram.updated_at,
                    "created_at": diagram.created_at,
                    "deleted_at": None,
                }
            )
            bind.execute(q)

    op.drop_table("diagram")
    op.drop_column("collection", "casefile")


def downgrade():
    pass
