# Feature Roadmap & Contribution Guide

This directory contains implementation specifications for the v1.1 roadmap.
Each spec is self-contained: an implementer should be able to complete a
feature using only its spec file and the existing codebase.

## How to work on a feature

1. Pick **one** spec. Create a branch named after it
   (e.g. `feat/product-low-stock-threshold`).
2. Follow the TDD order in the spec: write failing tests first, then implement.
3. Commit in small increments following [Conventional Commits](../../CONTRIBUTING.md) —
   typically `test:` (red), then `feat:` (green), then any `refactor:`.
4. Open a PR. All CI checks (lint, format, coverage ≥80%, audits) must pass.
5. One PR = one feature. Do not combine features in a single PR.

## Queue

| # | Spec | Status |
|---|------|--------|
| 1 | [Per-product low-stock threshold](feature-1-low-stock-threshold.md) | ready |
| 2 | [Order search & filtering](feature-2-order-search-filter.md) | ready |
| 3 | [Pagination on list endpoints](feature-3-pagination.md) | ready |
| 4 | [CSV export for products](feature-4-product-csv-export.md) | ready |
| 5 | [CSV export for orders](feature-5-order-csv-export.md) | blocked by #3 |
| 6 | [Soft delete + restore for products](feature-6-product-soft-delete.md) | ready |
