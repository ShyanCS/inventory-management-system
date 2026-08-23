# Feature 3 — Pagination on List Endpoints

## Goal

Return paginated, metadata-carrying responses from the three list endpoints
(`products`, `customers`, `orders`) and paginate the frontend tables.

**Important:** this changes response shapes consumed by existing pages and
tests. Update all consumers in the same PR.

## Current behavior

- All list endpoints accept `skip`/`limit` but return a bare array.
- Frontend pages render full arrays.

## Backend design

### Response envelope

Introduce a generic envelope in `app/schemas/` (e.g. `common.py`):

```python
class Page[T](BaseModel):
    items: list[T]
    total: int          # total rows matching filters (ignoring skip/limit)
    skip: int
    limit: int
```

Use `Page[ProductOut]`, `Page[CustomerOut]`, `Page[OrderOut]` as
`response_model`s. Keep `skip`/`limit` params for backward compatibility;
cap `limit` at 100 as today.

### Repository

- Each repo's `list()` gains a `count()` companion (or returns a tuple).
- `total` must respect the same filters (e.g. `low_stock=true`,
  feature-2 order filters).

### Endpoints

- `GET /api/v1/products` → `{ "items": [...], "total": 42, "skip": 0, "limit": 50 }`
- Same shape for customers, orders, **and** dashboard's low-stock list stays
  unchanged (it is not paginated).

## Backend tests

1. `test_list_products_returns_envelope_with_total`
2. `test_skip_limit_slice_items_correctly`
3. `test_total_ignores_pagination_but_respects_filters`
4. Same three for orders and customers.
5. Update every existing test that consumes bare arrays from these endpoints.

## Frontend design

### API layer (`src/api/*.js`)

Response of `.list()` is now the envelope; hooks store `items` and expose
`total`.

### UI

Add a shared `<Pagination page={n} pageSize={n} total={n} onChange={fn} />`
component in `src/components/common/`:

- Prev / Next buttons + "Page X of Y"
- Disabled states at bounds
- Page size fixed at 10 initially

Wire it into Products, Customers, and Orders pages. Keep filters
(feature 2) applied across page changes: changing filters resets to page 1.

### Frontend tests

- Component test: renders correct range, disables Prev on first page,
  Next on last page, calls onChange with new page.
- Page test (Products): initial load renders first slice; clicking Next
  requests with `skip=10`.
- Update MSW handlers to return envelopes; keep old fixtures as `items`.

## Commit checklist

- [ ] `test:` backend envelope tests + updated existing tests (red)
- [ ] `feat:` envelope + repos + routers (green)
- [ ] `test:` pagination component & page tests (red)
- [ ] `feat:` shared component + wire into three pages (green)
- [ ] CI green on the PR

## Notes for other specs

Feature 5 (order CSV export) depends on this envelope landing first —
CSV export should ignore pagination and stream all matching rows.
