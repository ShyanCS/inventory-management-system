"""add products.deleted_at for soft delete

Revision ID: b7c8d9e0f1a2
Revises: a1f2c3d4e5b6
Create Date: 2026-08-23 17:30:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b7c8d9e0f1a2"
down_revision = "a1f2c3d4e5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("deleted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "deleted_at")
