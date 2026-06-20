# Inventory & Order Management System — Progress Tracker

> **Purpose:** This document maintains full project context so work can be resumed seamlessly in any AI coding tool. It records what has been done, what's in progress, what's next, and key decisions made.

---

## 📋 Project Overview

- **Project**: Inventory & Order Management System
- **Stack**: FastAPI (Python 3.12) + PostgreSQL 16 + React 18 (Vite) + Tailwind CSS
- **Methodology**: Strict TDD (Red → Green → Refactor)
- **Spec files**: `MASTER_PROMPT.md`, `PROJECT_SPECIFICATION.md` (in repo root)

---

## 🏗️ Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| DB Driver | `psycopg2-binary` (sync) | Simpler testing, no async complexity |
| Primary Keys | Integer SERIAL | Simpler, performant, spec allows it |
| CI/CD | Skip Phase 12 | User preference — deployment steps in README instead |
| Deployment | Skip Phase 13 | User preference — deployment steps in README instead |
| UI Theme | Dark minimalistic modern | User preference — zinc-950 + indigo accent via Tailwind |

---

## 📊 Phase Progress

| Phase | Name | Status | Notes |
|---|---|---|---|
| 0 | Repository Scaffolding | ✅ Complete | Backend + frontend skeletons, health endpoint, smoke tests |
| 1 | Data Model & Migrations | ✅ Complete | SQLAlchemy models, Alembic migration, constraint tests |
| 2 | Product Management (Backend) | ✅ Complete | CRUD + service + router + tests |
| 3 | Customer Management (Backend) | ✅ Complete | CRUD + service + router + tests |
| 4 | Order Business Logic | ✅ Complete | Stock validation, atomic decrement, race conditions |
| 5 | Order API + Dashboard | ✅ Complete | Order router, dashboard endpoint, cancel-restock |
| 6 | Cross-Cutting Error Handling | ✅ Complete | Global exception handlers, error envelope |
| 7 | Frontend Scaffolding | ✅ Complete | API client, routing, Vitest + testing-library |
| 8 | Frontend: Product UI | ✅ Complete | ProductsPage, ProductForm, MSW mocks, 9 tests |
| 9 | Frontend: Customer UI | ✅ Complete | CustomersPage, CustomerForm, email validation, 9 tests |
| 10 | Frontend: Order UI + Dashboard | ✅ Complete | OrdersPage, DashboardPage, OrderForm, 12 new tests |
| 11 | Dockerization | ✅ Complete | Backend/Frontend Dockerfiles, Nginx conf, docker-compose.yml |
| 12 | CI (GitHub Actions) | ⏭️ Skipped | User decided to skip |
| 13 | Deployment | ⏭️ Skipped | User decided to skip — README instructions instead |
| 14 | Final Polish | ✅ Complete | Root README, cleanup |

---

## 📝 Detailed Phase Logs

### Phase 0 — Repository Scaffolding
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created (Backend)
- `.gitignore` — Python + Node.js gitignore
- `backend/requirements.txt` — FastAPI, SQLAlchemy 2.0, Alembic, psycopg2-binary, pytest, httpx
- `backend/.env.example` — Placeholder env vars for DB, CORS, app config
- `backend/app/__init__.py` — App package init
- `backend/app/main.py` — FastAPI app factory with `/health` endpoint, CORS, global exception handler
- `backend/app/core/__init__.py` — Core package init
- `backend/app/core/config.py` — pydantic-settings `Settings` class (env vars)
- `backend/app/core/database.py` — SQLAlchemy engine, SessionLocal, `get_db` dependency, `Base` class
- `backend/app/core/exceptions.py` — `AppException`, `NotFoundException`, `ConflictException`
- `backend/app/models/__init__.py` — Empty (models added in Phase 1)
- `backend/app/schemas/__init__.py` — Empty (schemas added in Phase 2+)
- `backend/app/repositories/__init__.py` — Empty (repos added in Phase 2+)
- `backend/app/services/__init__.py` — Empty (services added in Phase 2+)
- `backend/app/routers/__init__.py` — Empty (routers added in Phase 2+)
- `backend/tests/__init__.py` — Tests package
- `backend/tests/conftest.py` — TestClient fixture
- `backend/tests/test_health.py` — Health endpoint test (TDD)
- `backend/tests/unit/__init__.py` — Unit test subdirectory
- `backend/tests/api/__init__.py` — API test subdirectory

#### Files Created (Frontend)
- `frontend/` — Scaffolded via `create-vite@latest` with React template
- `frontend/vite.config.js` — Vite + React + Tailwind + Vitest config
- `frontend/.env.example` — `VITE_API_BASE_URL`
- `frontend/index.html` — Updated with SEO (title, meta description)
- `frontend/src/index.css` — Tailwind v4 `@import "tailwindcss"`
- `frontend/src/main.jsx` — React entry point (StrictMode)
- `frontend/src/App.jsx` — Dark UI shell with sidebar nav + React Router (4 page stubs)
- `frontend/src/api/client.js` — Centralized Axios instance from env var
- `frontend/tests/setup.js` — Vitest setup with jest-dom matchers
- `frontend/tests/App.test.jsx` — Smoke tests (brand, nav links, default route)

#### Dependencies Installed
- **Backend** (`.venv`): fastapi, uvicorn, sqlalchemy, alembic, pydantic-settings, psycopg2-binary, pytest, pytest-asyncio, httpx
- **Frontend** (`node_modules`): react, react-dom, react-router-dom, axios, tailwindcss, @tailwindcss/vite, vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, msw, jsdom

#### TDD Evidence
- **Red**: `test_health_returns_200` failed with `ModuleNotFoundError: No module named 'app.main'` (test written before implementation)
- **Green**: After creating `app/main.py` with `/health` endpoint → test passes
- **Frontend**: Smoke tests written, initially had multiple-match issue for 'Dashboard' text (fixed by querying via data-testid)

#### Test Results
- Backend: `1 passed` ✅
- Frontend: `3 passed` ✅

#### What's Deliberately Deferred
### Phase 1 — Data Model & Migrations
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Backend)
- `backend/app/models/product.py` — Product model with UNIQUE and CHECK constraints
- `backend/app/models/customer.py` — Customer model with UNIQUE constraint
- `backend/app/models/order.py` — Order and OrderItem models with FK cascades
- `backend/app/models/__init__.py` — Exported all models for Alembic discovery
- `backend/tests/unit/test_models.py` — TDD constraint tests
- `backend/tests/conftest.py` — Configured SQLite in-memory DB for local testing
- `backend/alembic.ini` — Alembic config
- `backend/alembic/env.py` — Configured with app models metadata
- `backend/alembic/versions/*_initial_models.py` — Autogenerated migration

#### TDD Evidence
- **Red**: Executed test_models.py prior to model creation; correctly failed with `ModuleNotFoundError`.
- **Green**: Created models, initialized alembic, applied migrations. All 16 tests pass. Constraints validated at the DB level via SQLite during tests.

#### What's Deliberately Deferred
- Product/Customer/Order schemas, services, repositories, routers → Phases 2-5
- Frontend page implementations → Phases 8-10
- Docker setup → Phase 11

---

### Phase 2 — Product Core Service
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Backend)
- `backend/app/schemas/product.py` — Pydantic schemas (Create, Update, Out)
- `backend/app/repositories/product_repository.py` — Product CRUD ops
- `backend/app/services/product_service.py` — Business logic (SKU duplication check)
- `backend/app/routers/products.py` — REST endpoints
- `backend/tests/unit/test_product_service.py` — Service unit tests
- `backend/tests/api/test_products_api.py` — API integration tests

#### TDD Evidence
- **Red**: Wrote service and API tests before implementation.
- **Green**: Implemented schemas, repo, service, router. 16/16 product tests pass.

#### What's Deliberately Deferred
- Customer/Order modules → Phases 3-5

---

### Phase 3 — Customer Management (Backend)
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Backend)
- `backend/app/schemas/customer.py` — Pydantic schemas using `EmailStr`
- `backend/app/repositories/customer_repository.py` — CRUD operations
- `backend/app/services/customer_service.py` — Email uniqueness logic
- `backend/app/routers/customers.py` — REST endpoints
- `backend/tests/unit/test_customer_service.py` — Service unit tests
- `backend/tests/api/test_customers_api.py` — API integration tests
- `backend/requirements.txt` — Added `email-validator` for Pydantic's `EmailStr`

#### TDD Evidence
- **Red**: Wrote service and API tests first. Encountered `ImportError` due to missing `email-validator` during test execution.
- **Green**: Installed `email-validator`, implemented functionality. 12/12 customer tests pass.

#### What's Deliberately Deferred
- Customer 'has orders' delete test constraints will be verified in Phase 5 since orders don't exist yet.

---

### Phase 4 — Order Business Logic
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Backend)
- `backend/app/schemas/order.py` — Pydantic schemas for Orders and Items
- `backend/app/repositories/order_repository.py` — CRUD operations utilizing `joinedload` and `.unique()` to eager load items.
- `backend/app/services/order_service.py` — Business logic handling stock sufficiency validation, total calculations, decimal arithmetic, atomic locking with `with_for_update()`, and order cancellation restocking.
- `backend/tests/unit/test_order_service.py` — Granular unit tests for business rules.

#### TDD Evidence
- **Red**: Wrote comprehensive unit tests ensuring stock remains unchanged if validation fails, atomic decrements succeed, totals calculate securely server-side, and race condition conflicts are caught.
- **Green**: Fixed transaction isolation/rollback interactions between the service layer and the testing framework. Total test suite passes (50/50 tests green).

#### What's Deliberately Deferred
- Exposing the business logic over HTTP REST endpoints → Phase 5

---

### Phase 5 — Order API + Dashboard
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Backend)
- `backend/app/schemas/dashboard.py` — Schema for dashboard aggregate data.
- `backend/app/routers/orders.py` — HTTP endpoints for creating, listing, fetching, and cancelling orders.
- `backend/app/routers/dashboard.py` — `/api/v1/dashboard/summary` providing total counts and low-stock alerts.
- `backend/tests/api/test_orders_api.py` — API integration tests asserting JSON responses, 201/204 codes, and 409 conflict structures.
- `backend/tests/api/test_dashboard_api.py` — Dashboard endpoint tests.
- `backend/tests/unit/test_customer_service.py` — Implemented deferred "customer with orders" delete constraint test.

#### TDD Evidence
- **Red**: Wrote API tests simulating HTTP calls to `/api/v1/orders` and `/api/v1/dashboard` asserting expected payload structures and status codes (200, 201, 204, 409).
- **Green**: Implemented the routers and wired them to `main.py`. The suite is entirely green.

#### What's Deliberately Deferred
- Detailed global error envelope format (Phase 6). The current endpoints use standard FastApi or basic `AppException` responses.

---

### Phase 6 — Cross-Cutting Error Handling
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Backend)
- `backend/app/main.py` — Registered `RequestValidationError` and general `Exception` handlers.
- `backend/tests/api/test_errors.py` — Verified standard `AppException` 404s, `RequestValidationError` 422s, and `Exception` 500s all return the same exact JSON envelope.

#### TDD Evidence
- **Red**: Wrote tests asserting exact JSON structure `{"error": {"code": "...", "message": "...", "details": ...}}` for various failure types.
- **Green**: Implemented handlers. Fixed `TestClient` default exception raising so the tests can assert on 500 statuses. Tests pass.

#### What's Deliberately Deferred
- We are now moving fully to the Frontend!

---

### Phase 7 — Frontend Scaffolding
- **Status**: ✅ Complete
- **Started**: 2026-06-18
- **Completed**: 2026-06-18

#### Files Created / Edited (Frontend)
- `frontend/package.json` — Verified dependencies and added standard `npm run test` script triggering `vitest run`.
- `frontend/src/api/client.js` — Base Axios instance configuration (`baseURL: import.meta.env.VITE_API_BASE_URL`).
- `frontend/src/App.jsx` — Validated layout shell and React Router implementation (completed earlier by StitchMCP).
- `frontend/tests/App.test.jsx` — Ran existing smoke tests using React Testing Library to confirm `jsdom` and assertions work correctly.

#### TDD Evidence
- Executed `npm run test` verifying that the layout components properly mount and route without crashing. 3/3 frontend tests passing out of the box.

#### What's Deliberately Deferred
- MSW (Mock Service Worker) setup. We will set up API mocks in Phase 8 specifically for the Product data.

---

### Phase 8 — Frontend: Product UI
- **Status**: ✅ Complete
- **Started**: 2026-06-20
- **Completed**: 2026-06-20

#### Files Created (Frontend)
- `frontend/src/api/products.js` — Thin Axios wrapper for all product endpoints.
- `frontend/src/hooks/useProducts.js` — Custom hook managing loading/error state and all product mutations.
- `frontend/src/components/products/ProductForm.jsx` — Accessible modal form with client-side validation for all fields.
- `frontend/src/components/common/ConfirmDialog.jsx` — Reusable delete confirmation dialog.
- `frontend/src/pages/ProductsPage.jsx` — Full Product management page with table, stock badges, and action buttons.
- `frontend/tests/mocks/server.js` — MSW node server for test API interception.
- `frontend/tests/mocks/handlers/productHandlers.js` — MSW handlers for all product endpoints (list, get, create 409, update, delete).
- `frontend/tests/pages/ProductsPage.test.jsx` — 9-test suite covering all user flows.

#### TDD Evidence
- **Red**: Wrote all 9 tests before implementing any components.
- **Green**: Implemented `ProductsPage`, `ProductForm`, `ConfirmDialog`, and `useProducts` hook. All 12 frontend tests green.

#### Features Delivered
- Products table with Name, SKU, Price, and contextual Stock badges (out-of-stock / low-stock / in-stock)
- Add Product button opening a modal form
- Client-side validation with inline error messages per field
- Edit button pre-populating the form with existing product data
- Delete button with a confirmation dialog before hard delete
- 409 Conflict error from the API surfaced as an inline error inside the form
- Loading spinner + error banner on list fetch failure

---

### Phase 9 — Frontend: Customer UI
- **Status**: ✅ Complete
- **Started**: 2026-06-20
- **Completed**: 2026-06-20

#### Files Created (Frontend)
- `frontend/src/api/customers.js` — Axios wrapper for customer endpoints.
- `frontend/src/hooks/useCustomers.js` — Custom hook managing loading/error state and customer mutations.
- `frontend/src/components/customers/CustomerForm.jsx` — Accessible modal form with name, email (with format validation), and phone fields.
- `frontend/src/pages/CustomersPage.jsx` — Full page: table with avatar initials, member-since date, add + delete actions; delete-error banner for 409 with-orders constraint.
- `frontend/tests/mocks/handlers/customerHandlers.js` — MSW handlers for customer endpoints (list, create 409, delete).
- `frontend/tests/pages/CustomersPage.test.jsx` — 9-test suite covering all user flows.

#### TDD Evidence
- **Red**: Wrote all 9 tests before implementing components.
- **Green**: Implemented all components. All 21 frontend tests green.

#### Features Delivered
- Customer table with avatar initials, email, phone, member-since date
- Add Customer modal with 3-field form and strict email format validation
- Duplicate email 409 Conflict surfaced as inline error in form
- Delete with confirmation dialog
- Delete 409 (customer has orders) surfaced as dismissable banner on the page

---

### Phase 10 — Frontend: Order UI + Dashboard
- **Status**: ✅ Complete
- **Started**: 2026-06-20
- **Completed**: 2026-06-20

#### Files Created (Frontend)
- `frontend/src/api/orders.js` — Axios wrapper for order endpoints.
- `frontend/src/api/dashboard.js` — Axios wrapper for dashboard summary.
- `frontend/src/hooks/useOrders.js` — Custom hook managing loading/error state and order mutations.
- `frontend/src/components/orders/OrderForm.jsx` — Multi-line item create form: customer dropdown, dynamic product/qty rows, live estimated total, client-side validation.
- `frontend/src/pages/OrdersPage.jsx` — Expandable order cards with status badges, create flow, cancel-with-confirmation.
- `frontend/src/pages/DashboardPage.jsx` — 3 stat cards (products/customers/orders) + low-stock products table.
- `frontend/tests/mocks/handlers/orderHandlers.js` — MSW handlers for orders (list, create 409, cancel) and dashboard summary.
- `frontend/tests/pages/OrdersPage.test.jsx` — 9-test suite.
- `frontend/tests/pages/DashboardPage.test.jsx` — 3-test suite.
- `frontend/src/App.jsx` — All 4 pages now use real implementations (no stubs remaining).

#### TDD Evidence
- **Red**: Wrote all 12 tests first.
- **Green**: Implemented all components. All 33 frontend tests green.

#### Features Delivered
- Order list with expandable cards showing line items (product, qty, unit_price, subtotal)
- Status badges: pending (amber), cancelled (zinc), completed (emerald)
- New Order form: customer dropdown + dynamic line items with add/remove, live total
- Insufficient stock 409 error surfaces inside the form (red alert)
- Cancel order with ConfirmDialog (restores stock server-side)
- Dashboard: stat cards + low-stock table with out-of-stock / low badges

---

### Phase 11 — Dockerization
- **Status**: ✅ Complete
- **Started**: 2026-06-20
- **Completed**: 2026-06-20

#### Files Created
- `docker-compose.yml` — Root orchestration file defining `db`, `backend`, and `frontend` services with networking and healthchecks.
- `backend/Dockerfile` — Multi-stage Python 3.12-slim image, installing psycopg2-binary in a build stage and running as non-root `appuser`.
- `backend/.dockerignore` — Excludes venv, pytest cache, and secrets.
- `backend/entrypoint.sh` — Runs Alembic migrations (`alembic upgrade head`) before starting Uvicorn.
- `frontend/Dockerfile` — Multi-stage build compiling React via Vite and serving statically from an Nginx Alpine image.
- `frontend/nginx.conf` — Nginx config handling React Router SPAs (fallback to `index.html`) and reverse-proxying `/api/` calls to the backend service.
- `frontend/.dockerignore` — Excludes node_modules and local environments.

#### Features Delivered
- One-command startup via `docker compose up --build`.
- Complete separation of services.
- Auto-migration of database on startup.
- Production-ready Nginx proxy layer.

---

### Phase 14 — Final Polish
- **Status**: ✅ Complete
- **Started**: 2026-06-20
- **Completed**: 2026-06-20

#### Actions Taken
- Authored a comprehensive root `README.md` detailing the project structure, tech stack, and providing both Docker and local (non-Docker) setup and test instructions.
- Removed the default Vite `README.md` from the `frontend/` directory to avoid confusion.
- Finalized this `PROGRESS.md` document, marking the official end of the development lifecycle.

---

## 🎉 Project Completed

- **Current Status**: All required phases successfully completed.
- **Testing Record**: 93 automated tests written and passing (60 Backend, 33 Frontend).
- **Codebase Health**: Excellent. Strong separation of concerns, robust transaction handling, and comprehensive mock/unit testing.

**Final Delivery**: The application is fully built, tested, and containerized. The user can launch it anytime using `docker-compose up --build`.

---

## 📂 File Structure

```
Inventory Management System/
├── .gitignore
├── MASTER_PROMPT.md
├── PROJECT_SPECIFICATION.md
├── PROGRESS.md                        ← this file
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── .venv/                         (gitignored)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app + /health
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Settings (pydantic-settings)
│   │   │   ├── database.py           # Engine, SessionLocal, get_db, Base
│   │   │   └── exceptions.py         # AppException hierarchy
│   │   ├── models/
│   │   │   └── __init__.py           (empty — Phase 1)
│   │   ├── schemas/
│   │   │   └── __init__.py           (empty — Phase 2+)
│   │   ├── repositories/
│   │   │   └── __init__.py           (empty — Phase 2+)
│   │   ├── services/
│   │   │   └── __init__.py           (empty — Phase 2+)
│   │   └── routers/
│   │       └── __init__.py           (empty — Phase 2+)
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py               # TestClient fixture
│       ├── test_health.py            # Health endpoint test
│       ├── unit/
│       │   └── __init__.py
│       └── api/
│           └── __init__.py
└── frontend/
    ├── .env.example
    ├── index.html                    # SEO-ready template
    ├── package.json
    ├── vite.config.js                # Vite + Tailwind + Vitest
    ├── src/
    │   ├── index.css                 # Tailwind v4 import
    │   ├── main.jsx                  # React entry
    │   ├── App.jsx                   # Dark sidebar layout + Router
    │   └── api/
    │       └── client.js             # Axios instance
    └── tests/
        ├── setup.js                  # Vitest + jest-dom setup
        └── App.test.jsx              # Smoke tests (3 passing)
```

---

## 🔑 Key Spec References

- **Data Model**: PROJECT_SPECIFICATION.md § 4 (products, customers, orders, order_items)
- **API Contract**: PROJECT_SPECIFICATION.md § 5 (endpoints, status codes, error shapes)
- **Business Rules**: PROJECT_SPECIFICATION.md § 6 (12 rules — unique SKU/email, stock validation, atomic decrement, etc.)
- **Backend Structure**: PROJECT_SPECIFICATION.md § 7
- **Frontend Structure**: PROJECT_SPECIFICATION.md § 8
- **Error Envelope**: PROJECT_SPECIFICATION.md § 5.6

---

## 🚨 Known Deferred Items

| Item | Deferred To | Reason |
|---|---|---|
| Customer "has orders" delete test | Phase 5 | Orders don't exist until Phase 4-5 |
| Concurrent race condition full test | Phase 4 | Requires row-level locking implementation |

---

## 💡 Migration Instructions

If migrating this project to another AI coding tool:

1. **Read these files first**: `MASTER_PROMPT.md`, `PROJECT_SPECIFICATION.md`, `PROGRESS.md` (this file)
2. **Check the Phase Progress table** above to see what's done vs. pending
3. **Read the Detailed Phase Logs** for context on completed work
4. **Resume from the "Current Working State" section** — it tells you exactly where to pick up
5. **Run the test suite** before making changes: `cd backend && .venv\Scripts\pytest -v` and `cd frontend && npx vitest run`
6. **Follow the MASTER_PROMPT.md** phase-by-phase instructions for any remaining phases
7. **Update this PROGRESS.md** after each phase is completed
