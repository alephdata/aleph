"""Remove document-related tables

Revision ID: af9b37868cf3
Revises: 284a9ec16306
Create Date: 2019-06-13 17:45:43.310462
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "af9b37868cf3"
down_revision = "284a9ec16306"


def upgrade():
    # op.drop_index('ix_document_tag_document_id', table_name='document_tag')
    # op.drop_index('ix_document_tag_origin', table_name='document_tag')
    # op.drop_index('ix_subscription_channel', table_name='subscription')
    # op.drop_index('ix_subscription_role_id', table_name='subscription')
    # op.drop_index('ix_document_record_document_id',
    #               table_name='document_record')
    # op.drop_index('ix_document_record_index',
    #               table_name='document_record')
    op.drop_table("subscription")
    op.drop_table("audit")
    op.drop_table("document_tag")
    op.drop_table("document_record")
    op.drop_column("document", "status")
    op.drop_column("document", "error_message")
    op.drop_column("document", "body_text")
    op.drop_column("document", "body_raw")


def downgrade():
    pass
