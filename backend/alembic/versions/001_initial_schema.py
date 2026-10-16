"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-15 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. websites
    op.create_table(
        'websites',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('url', sa.String(length=2048), nullable=False),
        sa.Column('check_interval_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='PENDING'),
        sa.Column('last_checked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_changed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_status_code', sa.Integer(), nullable=True),
        sa.Column('last_error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_websites_id'), 'websites', ['id'], unique=False)
    op.create_index(op.f('ix_websites_name'), 'websites', ['name'], unique=False)
    op.create_index(op.f('ix_websites_url'), 'websites', ['url'], unique=False)
    op.create_index(op.f('ix_websites_status'), 'websites', ['status'], unique=False)
    op.create_index(op.f('ix_websites_is_active'), 'websites', ['is_active'], unique=False)

    # 3. ignored_regions
    op.create_table(
        'ignored_regions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('website_id', sa.Integer(), nullable=False),
        sa.Column('selector_type', sa.String(length=20), nullable=False, server_default='css'),
        sa.Column('selector_value', sa.String(length=500), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['website_id'], ['websites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ignored_regions_id'), 'ignored_regions', ['id'], unique=False)

    # 4. snapshots
    op.create_table(
        'snapshots',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('website_id', sa.Integer(), nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=False),
        sa.Column('page_title', sa.String(length=300), nullable=True),
        sa.Column('raw_html_path', sa.String(length=500), nullable=True),
        sa.Column('normalized_text_path', sa.String(length=500), nullable=True),
        sa.Column('screenshot_path', sa.String(length=500), nullable=True),
        sa.Column('http_status', sa.Integer(), nullable=False, server_default='200'),
        sa.Column('response_time_ms', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('text_length', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['website_id'], ['websites.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_snapshots_id'), 'snapshots', ['id'], unique=False)
    op.create_index(op.f('ix_snapshots_content_hash'), 'snapshots', ['content_hash'], unique=False)

    # 5. detected_changes
    op.create_table(
        'detected_changes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('website_id', sa.Integer(), nullable=False),
        sa.Column('previous_snapshot_id', sa.Integer(), nullable=True),
        sa.Column('current_snapshot_id', sa.Integer(), nullable=False),
        sa.Column('change_percentage', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('lines_added', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('lines_removed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('diff_data_path', sa.String(length=500), nullable=True),
        sa.Column('detected_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['website_id'], ['websites.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['previous_snapshot_id'], ['snapshots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['current_snapshot_id'], ['snapshots.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_detected_changes_id'), 'detected_changes', ['id'], unique=False)

    # 6. notification_channels
    op.create_table(
        'notification_channels',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('channel_type', sa.String(length=30), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('config_json', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notification_channels_id'), 'notification_channels', ['id'], unique=False)

    # 7. notifications
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('change_id', sa.Integer(), nullable=False),
        sa.Column('channel_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('payload_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['change_id'], ['detected_changes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['channel_id'], ['notification_channels.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('notification_channels')
    op.drop_table('detected_changes')
    op.drop_table('snapshots')
    op.drop_table('ignored_regions')
    op.drop_table('websites')
    op.drop_table('users')
