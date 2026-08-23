# Feature 5 — CSV Export for Orders

**Depends on:** Feature 3 (pagination envelope) must be merged first —
this feature reuses the shared download helper and filter conventions.

## Goal

Download orders (with their line items) as a single flat CSV from the
Orders page, honoring active status/date filters.

## Backend design

### Endpoint

```
GET /api/v1/orders/export?status=&date_from=&date_to=
```

Same filter params as the order list endpoint (feature 2); all optional.

- `text/csv`, `Content-Disposition: attachment; filename="orders_YYYYMMDD_HHMM.csv"`
- One row **per order item**, plus an order-level row is *not* used.
  Columns:
  ```
  order_id,status,customer_name,created_at,item_id,product_sku,item_quantity,unit_price,item_subtotal,order_total
  ```
  Order-level fields repeat on each of that order's rows. This keeps the
  file flat and spreadsheet-friendly.
- Orders with zero items still produce one row with empty item columns
  (defensive; current model always has items).

### Service

`OrderService.export_csv(status=None, date_from=None, date_to=None) -> str`
reuses the same repository filtering as the list endpoint — extract the
shared filter builder so list and export cannot drift.

## API tests

1. `test_export_content_type_and_disposition`
2. `test_export_row_per_item_with_repeated_order_fields`
3. `test_export_respects_status_filter`
4. `test_export_respects_date_range_filter`
5. `test_export_customer_names_resolved`
6. Regression: `GET /orders/{id}` still resolves after adding the route.

## Frontend design

- "Export CSV" button in `OrdersPage.jsx` header, next to "New Order".
- Exports use the currently selected filters (status + date range) from
  feature 2's toolbar; search term `q` is ignored for export (documented
  behavior).
- Reuse `src/api/download.js` from feature 4.
- Button disabled while exporting; errors surface in the error banner.

### Frontend tests

- Clicking Export passes current filters as query params (MSW asserts URL).
- Export error shows banner (MSW 500 override).

## Commit checklist

- [ ] `test:` backend export tests (red)
- [ ] `feat:` export endpoint + shared filter builder (green)
- [ ] `test:` frontend button/filter-param tests (red)
- [ ] `feat:` Export button wired to filters (green)
- [ ] CI green on the PR
