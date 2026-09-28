"""Create OcuScan initial schema.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-09-28
"""

from alembic import op
import sqlalchemy as sa


revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "doctors",
        sa.Column("doctor_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("hospital", sa.String(length=200), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("experience", sa.Integer(), nullable=True),
        sa.Column("qualification", sa.String(length=200), nullable=True),
        sa.Column("designation", sa.String(length=150), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.CheckConstraint(
            "role IN ('doctor', 'admin')",
            name="check_doctor_role",
        ),
        sa.PrimaryKeyConstraint("doctor_id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "images",
        sa.Column("image_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("image_data", sa.LargeBinary(), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("disease", sa.String(length=100), nullable=False),
        sa.Column("subtype", sa.String(length=150), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["doctor_id"],
            ["doctors.doctor_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("image_id"),
    )


def downgrade() -> None:
    op.drop_table("images")
    op.drop_table("doctors")
