"""automatic ner

Revision ID: cbd285d713b4
Revises: 8d8c050d3eca
Create Date: 2016-05-18 12:06:31.545249

"""

# revision identifiers, used by Alembic.
revision = 'cbd285d713b4'
down_revision = '8d8c050d3eca'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.drop_column('entity', 'biography')

    op.add_column('entity', sa.Column('state', sa.String(length=128), nullable=True))
    op.add_column('reference', sa.Column('origin', sa.String(length=128), nullable=True))
    op.add_column('source', sa.Column('generate_entities', sa.Boolean(), nullable=True))

    op.execute('UPDATE source SET generate_entities = false;')
    op.execute("UPDATE reference SET origin = 'regex';")
    op.execute("UPDATE entity SET state = 'active';")
    op.execute("UPDATE entity SET state = 'deleted' WHERE deleted_at IS NOT NULL;")


def downgrade():
    op.add_column('entity', sa.Column('biography', sa.VARCHAR(), autoincrement=False, nullable=True))

    op.drop_column('source', 'generate_entities')
    op.drop_column('reference', 'origin')
    op.drop_column('entity', 'state')
