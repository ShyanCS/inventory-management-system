"""add products.low_stock_threshold

Revision ID: a1f2c3d4e5b6
Revises: 85c3c6ae4bb3
Create Date: 2026-08-23 10:30:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1f2c3d4e5b6"
down_revision = "85c3c6ae4bb3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("low_stock_threshold", sa.Integer(), nullable=False, server_default="10"),
    )


def downgrade() -> None:
    op.drop_column("products", "low_stock_threshold")
