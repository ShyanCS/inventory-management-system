# Feature 2 — Order Search & Filtering

## Goal

Let users find orders quickly: filter by status, filter by date range,
and search by order ID or customer name.

## Current behavior

- `GET /api/v1/orders` returns all orders (`app/routers/orders.py`);
  no query params besides none. Frontend `OrdersPage.jsx` renders the full list.

## Backend changes

### Router (`app/routers/orders.py`)

Extend the list endpoint with optional query params:

| Param | Type | Validation |
|---|---|---|
| `status` | `str \| None` | one of `pending`, `completed`, `cancelled`; anything else → `422` (use a `Literal` type) |
| `date_from` | `date \| None` | ISO date |
| `date_to` | `date \| None` | ISO date; must be >= `date_from`, else `422` |
| `q` | `str \| None` | free-text search: matches order id (`#12` or `12`) **or** customer full name (case-insensitive partial match) |

### Service / repository

- Add filtering logic to `OrderRepository.list(...)` — compose SQLAlchemy
  filters; all filters are AND-combined.
- Customer-name search requires a join to `customers`.
- Filtering on `created_at` is inclusive of both bounds
  (`created_at::date >= date_from AND created_at::date <= date_to`).

## API contract examples

```
GET /api/v1/orders?status=pending
GET /api/v1/orders?date_from=2026-01-01&date_to=2026-01-31
GET /api/v1/orders?q=12          # order #12
GET /api/v1/orders?q=Alice       # customers named Alice*
GET /api/v1/orders?status=shipped            # 422
GET /api/v1/orders?date_from=2026-05-01&date_to=2026-01-01   # 422
```

## Backend tests

1. `test_list_orders_filter_by_status`
2. `test_list_orders_rejects_invalid_status` (422)
3. `test_list_orders_filter_by_date_range_inclusive`
4. `test_list_orders_rejects_inverted_date_range` (422)
5. `test_search_matches_order_id`
6. `test_search_matches_customer_name_case_insensitive`
7. `test_filters_combine_with_and`

## Frontend changes

- `OrdersPage.jsx`: add a toolbar above the list:
  - Status `<select>`: All / pending / completed / cancelled
  - Two date inputs (`from`, `to`)
  - Search text input (debounced ~300ms)
- State lives in the page; pass params into a new
  `ordersApi.list(params)` signature (axios `params` option).
- Refetch on change; show "No orders match your filters" empty state when
  the result is empty and any filter is active.

### Frontend tests

- Changing status select issues request with `status` param and renders
  filtered rows (MSW handler inspects the URL).
- Typing in search triggers debounced request with `q` param.
- Empty result + active filter renders the empty-state message.
- Invalid date range client-side: show inline validation message without
  calling the API.

## Commit checklist

- [ ] `test:` backend filter/search tests (red)
- [ ] `feat:` router/service/repository filtering (green)
- [ ] `test:` frontend toolbar tests (red)
- [ ] `feat:` OrdersPage filter UI + api params (green)
- [ ] CI green on the PR

## Out of scope

- Sorting (separate feature if wanted).
- Pagination (see feature 3 — lands independently).
