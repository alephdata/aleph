"""Added fields to EntitySetItem to support profiles and removed Linkage

Revision ID: 9dcef7592cea
Revises: 3174fef04825
Create Date: 2020-07-21 13:42:06.509804

"""

# revision identifiers, used by Alembic.
revision = "9dcef7592cea"
down_revision = "4c9e198c5b31"

from itertools import groupby, takewhile
from collections import namedtuple

from aleph.model import Judgement

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade():
    op.add_column(
        "entityset_item", sa.Column("added_by_id", sa.Integer(), nullable=True)
    )
    judgement_enum = sa.Enum(
        "POSITIVE", "NEGATIVE", "UNSURE", "NO_JUDGEMENT", name="judgement"
    )
    judgement_enum.create(op.get_bind())
    op.add_column(
        "entityset_item", sa.Column("judgement", judgement_enum, nullable=True)
    )
    op.create_foreign_key(None, "entityset_item", "role", ["added_by_id"], ["id"])
    op.add_column(
        "entityset_item",
        sa.Column("compared_to_entity_id", sa.String(length=128), nullable=True),
    )

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    linkage_table = meta.tables["linkage"]
    entityset_table = meta.tables["entityset"]
    item_table = meta.tables["entityset_item"]
    q = sa.select([linkage_table]).order_by("profile_id")
    rp = bind.execute(q)

    profiles = groupby(
        takewhile(lambda x: x is not None, rp), key=lambda x: str(x.profile_id),
    )

    judgement_lookup = {
        True: Judgement.POSITIVE,
        False: Judgement.NEGATIVE,
        None: Judgement.UNSURE,
    }

    for profile_id, links in profiles:
        links = list(links)
        role_id = links[0].context_id
        collection_id = links[0].collection_id
        created_at = min(link.created_at for link in links)
        updated_at = max(link.updated_at for link in links)
        q = sa.insert(entityset_table)
        q = q.values(
            {
                "id": profile_id,
                "label": "linkage_migrate",
                "type": "profile",
                "role_id": role_id,
                "collection_id": collection_id,
                "updated_at": updated_at,
                "created_at": created_at,
            }
        )
        bind.execute(q)

        for link in links:
            q = sa.insert(item_table)
            q = q.values(
                {
                    "entityset_id": profile_id,
                    "entity_id": link.entity_id,
                    "collection_id": collection_id,
                    "updated_at": link.updated_at,
                    "created_at": link.created_at,
                    "added_by_id": link.decider_id,
                    "judgement": judgement_lookup[link.decision].name,
                    "deleted_at": None,
                }
            )
            bind.execute(q)
    op.drop_table("linkage")


def downgrade():
    op.drop_column("entityset_item", "compared_to_entity_id")
    op.drop_column("entityset_item", "judgement")

    judgement_enum = sa.Enum(
        "POSITIVE", "NEGATIVE", "UNSURE", "NO_JUDGEMENT", name="judgement"
    )
    judgement_enum.drop(op.get_bind())
    op.drop_column("entityset_item", "added_by_id")
