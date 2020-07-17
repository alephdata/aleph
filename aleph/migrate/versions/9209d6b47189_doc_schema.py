"""Document and Entity schema field.

Revision ID: 9209d6b47189
Revises: 84c0965d86e5
Create Date: 2017-12-01 17:01:23.705436

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "9209d6b47189"
down_revision = "84c0965d86e5"

SCHEMATA = {
    "text": "Pages",
    "scroll": "PlainText",
    "html": "HyperText",
    "tabular": "Table",
    "other": "Document",
}


def upgrade():
    op.alter_column(
        "document",
        "type",
        new_column_name="schema",
        type_=sa.String(255),
        nullable=False,
    )  # noqa
    op.alter_column(
        "entity", "type", new_column_name="schema", type_=sa.String(255), nullable=False
    )  # noqa

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    documents = meta.tables["document"]
    for old, new in SCHEMATA.items():
        q = sa.update(documents)
        q = q.where(documents.c.schema == old)
        q = q.values({documents.c.schema: new})
        bind.execute(q)


def downgrade():
    pass
