"""add image storage path for local storage transition

Revision ID: 003_image_storage_transition
Revises: 002_add_profile_photo
"""

from alembic import op
import sqlalchemy as sa


revision = "003_image_storage_transition"
down_revision = "002_add_profile_photo"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "images",
        "image_data",
        existing_type=sa.LargeBinary(),
        nullable=True,
    )

    op.add_column(
        "images",
        sa.Column(
            "image_path",
            sa.String(length=500),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("images", "image_path")

    op.alter_column(
        "images",
        "image_data",
        existing_type=sa.LargeBinary(),
        nullable=False,
    )
