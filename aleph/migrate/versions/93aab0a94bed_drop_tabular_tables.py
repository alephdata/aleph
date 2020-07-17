"""drop tabular tables

Revision ID: 93aab0a94bed
Revises: 601adc22db51
Create Date: 2016-03-16 10:14:07.738033

"""

# revision identifiers, used by Alembic.
revision = "93aab0a94bed"
down_revision = "601adc22db51"

import logging
from alembic import op
import sqlalchemy as sa

log = logging.getLogger(__name__)


def upgrade():
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    for name, table in meta.tables.items():
        if not name.startswith("tabular_"):
            continue
        log.warn("Dropping table: %r", table)
        table.drop(bind)


def downgrade():
    pass
