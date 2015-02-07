"""initial model

Revision ID: 2fbdba0f3aa6
Revises: None
Create Date: 2015-02-07 13:04:00.148230

"""

revision = '2fbdba0f3aa6'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_table('crawl_state',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('tag', sa.Unicode(), nullable=False),
    sa.Column('source', sa.Unicode(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crawl_state_tag'), 'crawl_state', ['tag'], unique=False)
    op.create_table('collection',
    sa.Column('slug', sa.Unicode(), nullable=False),
    sa.Column('label', sa.Unicode(), nullable=True),
    sa.Column('public', sa.Boolean(), nullable=True),
    sa.Column('token', sa.Unicode(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('slug')
    )
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('email', sa.Unicode(), nullable=True),
    sa.Column('display_name', sa.Unicode(), nullable=True),
    sa.Column('is_admin', sa.Boolean(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('twitter_id', sa.Unicode(), nullable=True),
    sa.Column('facebook_id', sa.Unicode(), nullable=True),
    sa.Column('api_key', sa.Unicode(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('list',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('label', sa.Unicode(), nullable=True),
    sa.Column('public', sa.Boolean(), nullable=True),
    sa.Column('creator_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['creator_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('collection_user',
    sa.Column('collection_slug', sa.Unicode(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['collection_slug'], ['collection.slug'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], )
    )
    op.create_table('entity',
    sa.Column('id', sa.Unicode(length=50), nullable=False),
    sa.Column('label', sa.Unicode(), nullable=True),
    sa.Column('category', sa.Enum('Person', 'Company', 'Organization', 'Other',
                                  name='entity_categories'), nullable=False),
    sa.Column('creator_id', sa.Integer(), nullable=True),
    sa.Column('list_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['creator_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['list_id'], ['list.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('list_user',
    sa.Column('list_id', sa.Integer(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['list_id'], ['list.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], )
    )
    op.create_table('selector',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('text', sa.Unicode(), nullable=True),
    sa.Column('normalized', sa.Unicode(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.Column('entity_id', sa.Unicode(length=50), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_selector_normalized'), 'selector', ['normalized'], unique=False)
    op.create_index(op.f('ix_selector_text'), 'selector', ['text'], unique=False)
    op.create_table('entity_tag',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('collection', sa.Unicode(length=100), nullable=True),
    sa.Column('package_id', sa.Unicode(length=100), nullable=True),
    sa.Column('entity_id', sa.Unicode(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['entity_id'], ['entity.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('entity_tag')
    op.drop_index(op.f('ix_selector_text'), table_name='selector')
    op.drop_index(op.f('ix_selector_normalized'), table_name='selector')
    op.drop_table('selector')
    op.drop_table('list_user')
    op.drop_table('entity')
    op.drop_table('collection_user')
    op.drop_table('list')
    op.drop_table('user')
    op.drop_table('collection')
    op.drop_index(op.f('ix_crawl_state_tag'), table_name='crawl_state')
    op.drop_table('crawl_state')
