"""refactor alerts

Revision ID: 666668eae682
Revises: 8526f853643a
Create Date: 2016-05-05 16:46:05.656646

"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "666668eae682"
down_revision = "8526f853643a"


def upgrade():
    op.add_column("alert", sa.Column("entity_id", sa.String(length=32), nullable=True))
    op.add_column("alert", sa.Column("query_text", sa.Unicode(), nullable=True))
    op.create_foreign_key(None, "alert", "entity", ["entity_id"], ["id"])
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    alert_table = meta.tables["alert"]
    rp = bind.execute(sa.select([alert_table]))
    for alert in rp.fetchall():
        deleted_at = alert.deleted_at
        query_text = alert.query.get("q", [None])[0]
        entity_id = alert.query.get("entity", [None])[0]
        if entity_id is not None and len(entity_id) < 30:
            entity_id = None

        if entity_id is None and query_text is None:
            deleted_at = datetime.utcnow()

        q = sa.update(alert_table).where(alert_table.c.id == alert.id)
        q = q.values(query_text=query_text, entity_id=entity_id, deleted_at=deleted_at)
        bind.execute(q)

    op.drop_column("alert", "query")
    op.drop_column("alert", "signature")


def downgrade():
    op.add_column(
        "alert",
        sa.Column("signature", sa.VARCHAR(), autoincrement=False, nullable=True),
    )
    op.add_column(
        "alert",
        sa.Column("query", postgresql.JSONB(), autoincrement=False, nullable=True),
    )
    op.drop_constraint(None, "alert", type_="foreignkey")
    op.drop_column("alert", "query_text")
    op.drop_column("alert", "entity_id")
