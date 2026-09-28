"""Add doctor profile photo fields.

Revision ID: 002_add_profile_photo
Revises: 001_initial_schema
Create Date: 2026-09-28
"""

from alembic import op
import sqlalchemy as sa


revision = "002_add_profile_photo"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "doctors",
        sa.Column("profile_photo", sa.LargeBinary(), nullable=True),
    )
    op.add_column(
        "doctors",
        sa.Column(
            "profile_photo_content_type",
            sa.String(length=100),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("doctors", "profile_photo_content_type")
    op.drop_column("doctors", "profile_photo")
