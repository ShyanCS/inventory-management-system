# Feature 4 — CSV Export for Products

## Goal

Let users download the product catalog as CSV from the Products page.

## Backend design

### Endpoint

```
GET /api/v1/products/export
```

**Route ordering matters:** this must be declared **before**
`@router.get("/{product_id}")` in `app/routers/products.py`, otherwise
"export" is parsed as an id and returns 422.

- Response: `text/csv; charset=utf-8` with
  `Content-Disposition: attachment; filename="products_YYYYMMDD_HHMM.csv"`
- Columns (in order): `id,name,sku,price,quantity_in_stock,low_stock_threshold,created_at`
- Respects the same filters as list (`low_stock`) but **ignores
  skip/limit** — exports everything matching.
- Use stdlib `csv.writer` writing into an `io.StringIO`; convert
  `Decimal` prices with `str()` to preserve two decimals.
- Dates in ISO 8601 UTC.

### Service

Add `ProductService.export_csv(low_stock: bool = False) -> str`.

## API tests

1. `test_export_returns_csv_content_type_and_disposition`
2. `test_export_contains_header_and_all_products`
3. `test_export_respects_low_stock_filter`
4. `test_export_formats_price_with_two_decimals`
5. `test_get_product_still_works_after_route_added` (regression:
   numeric ids unaffected)

## Frontend design

- "Export CSV" button next to "Add Product" in `ProductsPage.jsx`
  header (icon + text, consistent styling).
- Download via `axios` with `responseType: 'blob'` in
  `src/api/products.js` → create object URL → programmatic `<a>` click →
  revoke URL. Put this helper in `src/api/download.js` so feature 5 reuses it.
- While exporting, button shows disabled state.

### Frontend tests

- Clicking Export calls the endpoint (MSW) and triggers a download
  (mock `URL.createObjectURL`).
- Export failure shows error banner (MSW 500 override) — no silent catch.

## Commit checklist

- [ ] `test:` backend export tests (red)
- [ ] `feat:` export endpoint + service (green)
- [ ] `test:` frontend download helper & button tests (red)
- [ ] `feat:` Export button + shared download helper (green)
- [ ] CI green on the PR

## Out of scope

- Column selection UI, async/large exports, other entity exports
  (feature 5 handles orders).
