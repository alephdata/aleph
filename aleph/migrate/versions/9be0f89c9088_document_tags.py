"""document tags

Revision ID: 9be0f89c9088
Revises: 6d68a2c945cc
Create Date: 2017-06-12 15:07:46.321718

"""
from alembic import op
import sqlalchemy as sa

revision = '9be0f89c9088'
down_revision = '6d68a2c945cc'


def upgrade():
    op.create_table('document_tag',
                    sa.Column('id', sa.BigInteger(), nullable=False),
                    sa.Column('origin', sa.Unicode(length=255), nullable=False),  # noqa
                    sa.Column('type', sa.Unicode(length=16), nullable=False),
                    sa.Column('weight', sa.Integer(), nullable=True),
                    sa.Column('key', sa.Unicode(length=1024), nullable=False),
                    sa.Column('text', sa.Unicode(length=1024), nullable=True),
                    sa.Column('document_id', sa.Integer(), nullable=True),
                    sa.ForeignKeyConstraint(['document_id'], ['document.id'], ),  # noqa
                    sa.PrimaryKeyConstraint('id')
    )

    op.create_index(op.f('ix_document_tag_document_id'), 'document_tag', ['document_id'], unique=False)  # noqa
    op.create_index(op.f('ix_document_tag_key'), 'document_tag', ['key'], unique=False)  # noqa
    op.create_index(op.f('ix_document_tag_origin'), 'document_tag', ['origin'], unique=False)  # noqa
    op.drop_column('cache', 'created_at')
    op.alter_column('document', 'content_hash',
                    existing_type=sa.VARCHAR(length=65),
                    nullable=True)


def downgrade():
    pass
