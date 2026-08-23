# Feature 1 — Per-Product Low-Stock Threshold

## Goal

Replace the global `threshold` query parameter on `GET /products?low_stock=true`
with a per-product `low_stock_threshold` column (default 10), so each product
can define its own low-stock level. The dashboard's low-stock table and the
Products page badges should respect it.

## Current behavior

- `app/services/product_service.py::list_products(low_stock, threshold)` filters
  with a single global threshold passed from
  `app/routers/products.py:31`.
- Frontend: `ProductsPage.jsx` `StockBadge` hardcodes `qty <= 10`;
  `DashboardPage.jsx` renders `summary.low_stock_products`.

## Backend changes

### 1. Model (`app/models/product.py`)

```python
low_stock_threshold: Mapped[int] = mapped_column(
    Integer, nullable=False, default=10, server_default="10"
)
```

### 2. Migration

Generate an Alembic revision:

```bash
cd backend
alembic revision --autogenerate -m "add products.low_stock_threshold"
```

Verify the migration contains one `ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 10`
and that `alembic upgrade head` runs cleanly against SQLite **and** Postgres.

### 3. Schemas (`app/schemas/product.py`)

- `ProductBase` / `ProductCreate`: add `low_stock_threshold: int = Field(ge=0, le=10000)`
- `ProductOut`: include the field.

### 4. Service & repository

- `list_products(low_stock=True)` must use `Product.low_stock_threshold`
  per row: keep rows where `quantity_in_stock <= low_stock_threshold`.
  The global `threshold` query parameter is removed.
- Router: drop `threshold` param from `GET /api/v1/products`.

## API contract

| Request | Response |
|---|---|
| `POST /api/v1/products` body includes `"low_stock_threshold": 5` | `201`, echoes field |
| `POST /api/v1/products` without the field | `201`, defaults to `10` |
| `PUT /api/v1/products/{id}` with `"low_stock_threshold": 2` | `200`, updated |
| `GET /api/v1/products?low_stock=true` | only products where stock <= own threshold |
| `GET /api/v1/products` with `threshold=` param | `422` (unknown query param rejected by FastAPI) |

## Backend tests (`backend/tests/`)

Add to existing product API/service test files:

1. `test_create_product_defaults_low_stock_threshold` — created product has `10`.
2. `test_create_product_with_custom_threshold` — echoes supplied value.
3. `test_reject_negative_threshold` — `-1` → `422`.
4. `test_low_stock_uses_per_product_thresholds` — create:
   - A: stock 8, threshold 10 (low)
   - B: stock 8, threshold 5 (**not** low)
   - C: stock 20, threshold 25 (low)
   → `GET ?low_stock=true` returns exactly A and C.

## Frontend changes

- `src/components/products/ProductForm.jsx`: add a numeric
  "Low stock threshold" input (default 10, min 0) included in validation
  and payload; update `emptyForm`.
- `src/pages/ProductsPage.jsx`: `StockBadge({ qty })` →
  `StockBadge({ qty, threshold })`, badge shows "Low" when
  `qty <= threshold`; pass `product.low_stock_threshold ?? 10`.
- Dashboard needs no change if backend still returns `low_stock_products`.

### Frontend tests

- Form renders the new input and submits its value (extend
  `tests/pages/ProductsPage.test.jsx`).
- Badge shows "out of stock" / "low" / "in stock" states using a custom
  threshold (e.g. stock 8 + threshold 5 → normal state).

## Commit checklist

- [ ] `test:` backend tests for threshold behavior (red)
- [ ] `feat:` model column + migration + schema/service/router changes (green)
- [ ] `test:` frontend form/badge tests (red)
- [ ] `feat:` ProductForm input + StockBadge change (green)
- [ ] CI green on the PR

## Out of scope

- Notifications/alerts on crossing the threshold.
- Changing dashboard summary computation beyond the filter itself.
