# Feature 6 — Soft Delete & Restore for Products

## Goal

Deleting a product that is referenced by order items currently fails with
409. Instead of a hard delete, support soft deletion: products get
`deleted_at`; deleted products vanish from the catalog but keep referential
integrity, and can be restored.

## Backend changes

### Model + migration

```python
deleted_at: Mapped[datetime | None] = mapped_column(nullable=True, default=None)
```

Alembic migration: `ADD COLUMN deleted_at TIMESTAMPTZ NULL`.

Define a property:

```python
@property
def is_deleted(self) -> bool:
    return self.deleted_at is not None
```

### Behavior matrix

| Operation | Deleted product |
|---|---|
| `GET /products` (list) | excluded |
| `GET /products/{id}` | `404 NOT_FOUND` |
| `PUT /products/{id}` | `404` |
| `DELETE /products/{id}` | sets `deleted_at = now()` → `204` |
| `POST /products` with same SKU as a deleted product | `409 CONFLICT` (SKU uniqueness must still hold — do **not** relax the unique constraint) |
| Order creation referencing deleted product | blocked: stock validation treats it as missing (`CONFLICT`) |

### Restore endpoint

```
POST /api/v1/products/{id}/restore
```

- Clears `deleted_at`.
- `200` with the restored product; `404` if id doesn't exist;
  `409 CONFLICT` if a *different* active product has taken the SKU.

### Repository / service

- All existing queries gain `WHERE deleted_at IS NULL`
  (centralize in repo base query, don't sprinkle it).
- `delete_product` becomes `soft_delete_product`: set timestamp instead of
  `session.delete()`. The IntegrityError path from hard deletes disappears —
  remove its handler and update tests that asserted the 409-on-delete
  behavior.

## API tests

1. `test_delete_sets_deleted_at_and_hides_from_list`
2. `test_get_deleted_product_returns_404`
3. `test_update_deleted_product_returns_404`
4. `test_restore_clears_deleted_at`
5. `test_restore_conflicts_when_sku_taken_by_active_product` (409)
6. `test_create_with_deleted_sku_still_conflicts` (409)
7. `test_order_cannot_reference_deleted_product`
8. Update/remove old hard-delete tests (referenced-by-order 409 test).

## Frontend design

- Delete flow stays identical for users (ConfirmDialog → DELETE → row
  disappears).
- No restore UI yet (API-only feature); note this in the PR description.

## Frontend tests

- Existing delete tests keep passing unchanged — that's part of the point.

## Commit checklist

- [ ] `test:` backend soft-delete behavior matrix (red)
- [ ] `feat:` column + migration + repo/service/router changes (green)
- [ ] `test:` restore endpoint tests (red)
- [ ] `feat:` restore route (green)
- [ ] CI green on the PR

## Out of scope

- Trash/restore UI page.
- Soft delete for customers/orders.
