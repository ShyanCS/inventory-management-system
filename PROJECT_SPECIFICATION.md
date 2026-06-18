# Inventory & Order Management System — Technical Specification

**Document type:** Engineering specification & build plan
**Purpose:** Single source of truth for building this assessment project, intended to be fed (alongside the master prompt) to an AI coding agent / AI IDE so it can build the system incrementally using Test-Driven Development.

---

## 1. Project Summary

A simplified but production-shaped Inventory & Order Management System consisting of:

- A **Python backend API** (FastAPI) backed by **PostgreSQL**, exposing REST endpoints for products, customers, and orders, with inventory business rules enforced server-side.
- A **React frontend** (Vite) that consumes the API to manage products, customers, and orders, plus a dashboard summary view.
- A **Dockerized** setup (backend, frontend, database) orchestrated with **Docker Compose**, configured entirely through environment variables.
- A **deployed, publicly accessible** version of both frontend and backend on free-tier hosting, plus a backend image published to Docker Hub.

The system must enforce: unique SKUs, unique customer emails, non-negative stock, no order can be created if stock is insufficient, and stock must be automatically reduced when an order is placed.

---

## 2. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend language/framework | Python 3.12, FastAPI | Async-capable, automatic OpenAPI docs, strong typing via Pydantic |
| ORM / migrations | SQLAlchemy 2.0 + Alembic | Explicit migrations instead of `create_all` in production |
| Validation | Pydantic v2 | Request/response schemas separate from ORM models |
| DB driver | `psycopg` (v3) or `asyncpg` | Pick one and use consistently |
| Backend testing | pytest, pytest-asyncio, httpx (`AsyncClient`/`TestClient`) | TDD-first; tests run against a real Postgres test database |
| Database | PostgreSQL 16 | Run via Docker Compose locally; managed Postgres in production |
| Frontend | React 18 + Vite | Faster dev server, smaller production builds than CRA |
| Frontend routing | React Router v6 | |
| Frontend state | React Context + hooks (no Redux needed for this scope) | |
| Frontend HTTP client | Axios (or native `fetch` wrapper) | Centralized API client module |
| Frontend styling | Tailwind CSS | Fast, consistent, responsive utility classes |
| Frontend testing | Vitest + React Testing Library, MSW for API mocking | TDD-first for components |
| Containerization | Docker, multi-stage builds | Slim base images (`python:3.12-slim`, `node:20-alpine`, `nginx:alpine`) |
| Orchestration | Docker Compose | `db`, `backend`, `frontend` services |
| Version control | Git + GitHub | Conventional commits, one feature/test pair per commit where practical |
| Backend hosting | Render (primary) — Railway or Fly.io as alternatives | Deploys from Dockerfile |
| Frontend hosting | Vercel (primary) — Netlify as alternative | Static build deploy |
| Image registry | Docker Hub | Public image for the backend |

---

## 3. System Architecture

```
                    ┌────────────────────────┐
                    │        Browser          │
                    └───────────┬─────────────┘
                                │ HTTPS
                                ▼
                    ┌────────────────────────┐
                    │   React SPA (Vercel)    │
                    │  served as static build │
                    └───────────┬─────────────┘
                                │ REST / JSON (HTTPS)
                                ▼
                    ┌────────────────────────┐
                    │  FastAPI backend        │
                    │  (Render / Railway)     │
                    │  - routers              │
                    │  - services (business   │
                    │    logic)               │
                    │  - repositories (DB)    │
                    │  - schemas (Pydantic)   │
                    └───────────┬─────────────┘
                                │ SQL (asyncpg/psycopg)
                                ▼
                    ┌────────────────────────┐
                    │   PostgreSQL 16          │
                    │   (managed instance)     │
                    └────────────────────────┘
```

Locally, all three boxes (frontend, backend, db) run as Docker Compose services on a private network, with the frontend container's nginx reverse-proxying or directly calling the backend container by service name.

### 3.1 Backend layering

The backend is split into clear layers so that business rules are testable in isolation from HTTP and from the database:

1. **`models/`** — SQLAlchemy ORM models (tables).
2. **`schemas/`** — Pydantic request/response models (API contracts), separate from ORM models.
3. **`repositories/`** — Data-access functions (pure CRUD, no business rules).
4. **`services/`** — Business logic (uniqueness checks, stock validation, stock reduction, total calculation). This is the layer most TDD effort targets.
5. **`routers/`** — FastAPI route handlers that translate HTTP ↔ schemas ↔ services.
6. **`core/`** — config (env vars), database session management, exception handlers.

This separation lets unit tests exercise `services/` with a test DB session, without needing to spin up HTTP at all, and lets API tests exercise the full stack through `TestClient`.

---

## 4. Data Model

### 4.1 `products`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (or `SERIAL`) | Primary key |
| `name` | VARCHAR(200) | NOT NULL |
| `sku` | VARCHAR(50) | NOT NULL, **UNIQUE**, indexed |
| `price` | NUMERIC(10,2) | NOT NULL, CHECK (`price > 0`) |
| `quantity_in_stock` | INTEGER | NOT NULL, DEFAULT 0, CHECK (`quantity_in_stock >= 0`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now(), updated on write |

### 4.2 `customers`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (or `SERIAL`) | Primary key |
| `full_name` | VARCHAR(150) | NOT NULL |
| `email` | VARCHAR(255) | NOT NULL, **UNIQUE**, indexed |
| `phone` | VARCHAR(30) | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() |

### 4.3 `orders`

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (or `SERIAL`) | Primary key |
| `customer_id` | FK → `customers.id` | NOT NULL, ON DELETE RESTRICT |
| `status` | ENUM(`pending`, `completed`, `cancelled`) | NOT NULL, default `pending` |
| `total_amount` | NUMERIC(10,2) | NOT NULL, computed server-side, never trusted from the client |
| `created_at` | TIMESTAMPTZ | NOT NULL, default now() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, default now() |

### 4.4 `order_items` (junction table — an order can contain multiple products)

| Column | Type | Constraints |
|---|---|---|
| `id` | UUID (or `SERIAL`) | Primary key |
| `order_id` | FK → `orders.id` | NOT NULL, ON DELETE CASCADE, indexed |
| `product_id` | FK → `products.id` | NOT NULL, ON DELETE RESTRICT, indexed |
| `quantity` | INTEGER | NOT NULL, CHECK (`quantity > 0`) |
| `unit_price` | NUMERIC(10,2) | NOT NULL — **snapshot** of `products.price` at order time |
| `subtotal` | NUMERIC(10,2) | NOT NULL — `quantity * unit_price`, stored for auditability |

**Design rationale:** the assessment text says an order needs "Product reference(s)" (plural), so a single `product_id` column on `orders` is insufficient. A proper `order_items` table supports one-or-more line items per order, mirrors how real e-commerce systems are modeled, and keeps the unit price immutable even if the product's price changes later.

---

## 5. API Specification

Base path: `/api/v1`. All responses are JSON. All list endpoints support `limit`/`offset` pagination (default `limit=50`).

### 5.1 Products

| Method | Path | Description | Success | Failure cases |
|---|---|---|---|---|
| POST | `/products` | Create a product | 201 + product | 422 invalid body, 409 duplicate SKU |
| GET | `/products` | List products (supports `?low_stock=true&threshold=10`) | 200 + array | — |
| GET | `/products/{id}` | Get one product | 200 + product | 404 not found |
| PUT | `/products/{id}` | Update a product | 200 + product | 404 not found, 422 invalid body, 409 duplicate SKU |
| DELETE | `/products/{id}` | Delete a product | 204 | 404 not found, 409 if referenced by existing order items |

Example create request:
```json
{ "name": "Wireless Mouse", "sku": "WM-1001", "price": 19.99, "quantity_in_stock": 100 }
```

### 5.2 Customers

| Method | Path | Description | Success | Failure cases |
|---|---|---|---|---|
| POST | `/customers` | Create a customer | 201 + customer | 422 invalid body, 409 duplicate email |
| GET | `/customers` | List customers | 200 + array | — |
| GET | `/customers/{id}` | Get one customer | 200 + customer | 404 not found |
| DELETE | `/customers/{id}` | Delete a customer | 204 | 404 not found, 409 if customer has existing orders |

Example create request:
```json
{ "full_name": "Asha Verma", "email": "asha@example.com", "phone": "+91-9876543210" }
```

### 5.3 Orders

| Method | Path | Description | Success | Failure cases |
|---|---|---|---|---|
| POST | `/orders` | Create an order with one or more line items | 201 + order (with items, total) | 422 invalid body, 404 unknown customer/product, **409 insufficient stock** |
| GET | `/orders` | List orders (supports `?customer_id=`) | 200 + array | — |
| GET | `/orders/{id}` | Get order detail with line items | 200 + order | 404 not found |
| DELETE | `/orders/{id}` | Cancel an order | 200/204 | 404 not found, 409 if already cancelled |

Example create request:
```json
{
  "customer_id": "f0c1...",
  "items": [
    { "product_id": "a1b2...", "quantity": 2 },
    { "product_id": "c3d4...", "quantity": 1 }
  ]
}
```

Example success response:
```json
{
  "id": "9f8e...",
  "customer_id": "f0c1...",
  "status": "pending",
  "total_amount": 59.97,
  "items": [
    { "product_id": "a1b2...", "quantity": 2, "unit_price": 19.99, "subtotal": 39.98 },
    { "product_id": "c3d4...", "quantity": 1, "unit_price": 19.99, "subtotal": 19.99 }
  ],
  "created_at": "2026-06-18T10:00:00Z"
}
```

Cancelling an order (`DELETE /orders/{id}`) restores the cancelled quantities back to `products.quantity_in_stock`, since the assessment frames this as "Cancel/Delete," not a hard ledger delete.

### 5.4 Dashboard

| Method | Path | Description |
|---|---|---|
| GET | `/dashboard/summary` | Returns `{ total_products, total_customers, total_orders, low_stock_products: [...] }` |

A dedicated endpoint avoids the frontend stitching together four separate calls and re-implementing the "low stock" threshold logic client-side.

### 5.5 Operational endpoint

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness/readiness check used by Docker Compose `healthcheck` and the hosting platform |

### 5.6 Error response shape

All errors use a single consistent envelope so the frontend has one error-parsing code path:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Only 3 units of SKU WM-1001 are available.",
    "details": { "product_id": "a1b2...", "requested": 5, "available": 3 }
  }
}
```

| HTTP status | Used for |
|---|---|
| 400 | Malformed request that doesn't fit the 422 validation shape |
| 404 | Resource not found |
| 409 | Conflict — duplicate SKU/email, insufficient stock, deleting a referenced entity |
| 422 | Pydantic validation failure (missing/invalid fields) |
| 500 | Unhandled server error (logged, never leaks internals to the client) |

---

## 6. Business Logic Rules (authoritative list)

1. `products.sku` is unique — enforced at the DB level (`UNIQUE` constraint) **and** checked in the service layer to return a clean 409 instead of a raw DB error.
2. `customers.email` is unique — same dual enforcement.
3. `products.quantity_in_stock` can never go negative — DB `CHECK` constraint as a last line of defense, plus an application-level check before commit.
4. An order cannot be created if any requested line item's quantity exceeds the product's current `quantity_in_stock`. The entire order is rejected (no partial orders) — this must be validated for *all* line items before any stock is decremented.
5. Creating an order decrements stock for every line item, and this must happen atomically with order creation: if stock decrement fails for any item, the whole transaction rolls back (no order is created, no stock is touched).
6. To prevent race conditions under concurrent requests, stock decrement uses a row-level lock (`SELECT ... FOR UPDATE`) inside the same DB transaction as the insert, so two simultaneous orders for the last unit cannot both succeed.
7. `total_amount` is always computed server-side from `quantity * unit_price` per line item, summed. The client never supplies a total, and any client-supplied total is ignored.
8. `unit_price` on each `order_item` is a snapshot of the product's price at the moment of order creation, so historical orders remain accurate if the product's price later changes.
9. Cancelling an order restores the cancelled line items' quantities to the corresponding products' stock.
10. A product referenced by at least one existing order cannot be hard-deleted (409) — this preserves order history integrity. (Soft-delete / "discontinue" flag is an acceptable alternative if more time is available.)
11. A customer with at least one existing order cannot be deleted (409), for the same reason.
12. All request bodies are validated by Pydantic schemas before any business logic runs; invalid input never reaches the service layer.

---

## 7. Backend Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app factory, router registration, CORS, exception handlers
│   ├── core/
│   │   ├── config.py           # Settings loaded from environment variables (pydantic-settings)
│   │   ├── database.py         # Engine/session management
│   │   └── exceptions.py       # Custom exception classes + handlers → error envelope
│   ├── models/
│   │   ├── product.py
│   │   ├── customer.py
│   │   └── order.py             # Order + OrderItem
│   ├── schemas/
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── order.py
│   │   └── dashboard.py
│   ├── repositories/
│   │   ├── product_repository.py
│   │   ├── customer_repository.py
│   │   └── order_repository.py
│   ├── services/
│   │   ├── product_service.py
│   │   ├── customer_service.py
│   │   └── order_service.py     # stock validation, decrement, total calculation
│   └── routers/
│       ├── products.py
│       ├── customers.py
│       ├── orders.py
│       └── dashboard.py
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py              # test DB fixture, app fixture, client fixture
│   ├── unit/
│   │   ├── test_product_service.py
│   │   ├── test_customer_service.py
│   │   └── test_order_service.py
│   └── api/
│       ├── test_products_api.py
│       ├── test_customers_api.py
│       ├── test_orders_api.py
│       └── test_dashboard_api.py
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── .env.example
```

## 8. Frontend Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js            # Axios instance, base URL from env, interceptors
│   │   ├── products.js
│   │   ├── customers.js
│   │   └── orders.js
│   ├── components/
│   │   ├── layout/               # Navbar, Sidebar, PageLayout
│   │   ├── products/             # ProductList, ProductForm, ProductCard
│   │   ├── customers/            # CustomerList, CustomerForm
│   │   ├── orders/                # OrderList, OrderForm, OrderDetail
│   │   ├── dashboard/             # SummaryCards, LowStockTable
│   │   └── common/                # Button, Input, Modal, Toast, ErrorBanner, LoadingSpinner
│   ├── context/
│   │   └── AppContext.jsx        # shared state (toasts, maybe cached lookups)
│   ├── hooks/
│   │   ├── useProducts.js
│   │   ├── useCustomers.js
│   │   └── useOrders.js
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── CustomersPage.jsx
│   │   └── OrdersPage.jsx
│   ├── App.jsx                    # Router setup
│   └── main.jsx
├── tests/
│   ├── setup.js                  # MSW server setup
│   ├── components/
│   └── pages/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── Dockerfile
├── nginx.conf
├── .dockerignore
└── .env.example
```

---

## 9. Testing Strategy (Test-Driven Development)

The whole project is built **test-first**: for every unit of behavior, a failing test is written before the implementation code, then the minimum code is written to pass it, then the code is refactored while keeping tests green (classic Red → Green → Refactor).

### 9.1 Backend test pyramid

1. **Unit tests (`tests/unit/`)** — exercise `services/` functions directly against a test DB session, no HTTP involved. This is where business rules live, so this is the densest test layer: SKU uniqueness, email uniqueness, stock-sufficient/insufficient paths, total calculation, stock decrement, stock restoration on cancel, race-condition locking behavior.
2. **API tests (`tests/api/`)** — exercise the full FastAPI app through `httpx`/`TestClient` against a real test Postgres database, asserting status codes, response bodies, and error envelopes for every endpoint listed in section 5.
3. **Migration sanity check** — a smoke test that `alembic upgrade head` runs cleanly against a fresh database in CI.

A dedicated test database (e.g. `inventory_test`) is used, with each test wrapped in a transaction that is rolled back afterward (or the schema is recreated per test session) so tests are isolated and repeatable.

### 9.2 Frontend test pyramid

1. **Unit tests** — pure utility functions (e.g., currency formatting, validation helpers).
2. **Component tests (React Testing Library)** — render forms and lists in isolation, assert validation messages appear, assert correct API calls are triggered (mocked via MSW), assert success/error toasts render.
3. **Page-level integration tests** — render a full page with the router and mocked API layer, simulate a user adding a product / placing an order, assert the UI updates (list refreshes, stock value reflects the new order, error banner shows on insufficient stock).

### 9.3 Definition of done for each feature

A feature (e.g., "create product") is not considered complete until:
- Failing tests exist and were observed failing.
- Implementation makes them pass.
- Edge cases from section 6 relevant to that feature are covered (duplicate SKU, negative stock, etc.).
- `pytest` / `npm test` is fully green for the whole suite, not just the new tests.

---

## 10. Docker & Docker Compose

### 10.1 Backend Dockerfile (multi-stage, slim)

- Stage 1 (`builder`): `python:3.12-slim`, install build deps, install Python packages into a virtualenv.
- Stage 2 (`runtime`): fresh `python:3.12-slim`, copy the virtualenv from the builder, copy app code, create and switch to a non-root user, expose port `8000`, run `uvicorn app.main:app --host 0.0.0.0 --port 8000` (or `gunicorn -k uvicorn.workers.UvicornWorker` for production-grade process management).
- `HEALTHCHECK` hitting `/health`.

### 10.2 Frontend Dockerfile (multi-stage)

- Stage 1 (`builder`): `node:20-alpine`, `npm ci`, `npm run build` (Vite outputs static files to `dist/`). The API base URL is injected at build time via `VITE_API_BASE_URL` build arg, **or** a small `entrypoint.sh` writes a `window.__APP_CONFIG__` runtime config file from environment variables at container start, so the same image can be reused across environments without rebuilding (the recommended approach, since Vite env vars are normally baked in at build time).
- Stage 2 (`runtime`): `nginx:alpine`, copy `dist/` into `/usr/share/nginx/html`, copy a custom `nginx.conf` that serves the SPA with a fallback to `index.html` for client-side routing, expose port `80`.

### 10.3 `docker-compose.yml` (local development)

Services:
- **`db`**: `postgres:16-alpine`, env vars `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` from `.env`, named volume `pgdata:/var/lib/postgresql/data`, healthcheck via `pg_isready`.
- **`backend`**: builds from `./backend`, `depends_on: db (condition: service_healthy)`, env var `DATABASE_URL` built from the same Postgres credentials, port `8000:8000`, runs Alembic migrations on startup (entrypoint script: `alembic upgrade head && uvicorn ...`).
- **`frontend`**: builds from `./frontend`, `depends_on: backend`, port `5173:80` (or `3000:80`), env var pointing at the backend's reachable URL.

A named volume guarantees Postgres data persists across `docker compose down`/`up` cycles (but not `down -v`).

### 10.4 `.dockerignore` (both services)

`node_modules`, `.git`, `__pycache__`, `*.pyc`, `.venv`, `venv`, `dist`, `build`, `.env`, `*.log`, `.pytest_cache`, `.vscode`, `.DS_Store`.

---

## 11. Environment Variables

| Variable | Used by | Example | Notes |
|---|---|---|---|
| `POSTGRES_USER` | db, backend | `inventory_user` | |
| `POSTGRES_PASSWORD` | db, backend | (secret) | Never committed; only in `.env` (gitignored) and host platform secrets |
| `POSTGRES_DB` | db, backend | `inventory` | |
| `POSTGRES_HOST` | backend | `db` (compose) / managed host (prod) | |
| `POSTGRES_PORT` | backend | `5432` | |
| `DATABASE_URL` | backend | `postgresql+psycopg://user:pass@db:5432/inventory` | Can be composed from the above instead of set directly |
| `BACKEND_CORS_ORIGINS` | backend | `https://your-app.vercel.app,http://localhost:5173` | Comma-separated allow-list |
| `ENVIRONMENT` | backend | `development` / `production` | Toggles debug behavior/logging |
| `LOG_LEVEL` | backend | `INFO` | |
| `VITE_API_BASE_URL` | frontend (build) | `https://your-backend.onrender.com/api/v1` | Baked in at build time unless runtime-config approach is used |

A `.env.example` file with placeholder (non-secret) values is committed to the repo for both backend and frontend; the real `.env` is gitignored.

---

## 12. Deployment Plan

1. **Database**: provision a free managed Postgres instance (Render Postgres free tier, or Railway/Neon/Supabase as alternatives) and note its connection string.
2. **Backend**: push the repo to GitHub; create a new Web Service on Render (or Railway/Fly.io) pointing at the backend Dockerfile; set environment variables (`DATABASE_URL`, `BACKEND_CORS_ORIGINS`, `ENVIRONMENT=production`); confirm the platform runs `alembic upgrade head` on deploy (via the container entrypoint) and that `/health` returns 200.
3. **Docker Hub**: `docker build -t <dockerhub-username>/inventory-backend:latest ./backend` then `docker push <dockerhub-username>/inventory-backend:latest`; record the image URL for submission.
4. **Frontend**: import the repo into Vercel (or Netlify), set the project root to `frontend/`, set `VITE_API_BASE_URL` to the deployed backend's public URL + `/api/v1`, deploy.
5. **CORS check**: confirm the backend's `BACKEND_CORS_ORIGINS` includes the deployed frontend's exact origin.
6. **Smoke test in production**: create a product, create a customer, place an order, confirm stock decrements, confirm an over-quantity order is rejected with 409, confirm the dashboard summary reflects the changes — all against the live URLs.

---

## 13. Incremental Build Plan (TDD Phases)

This is the phase order used by the master prompt. Each phase ends with a fully green test suite and a commit before moving to the next phase. No phase skips writing tests first.

| Phase | Scope | Key tests written first |
|---|---|---|
| 0 | Repo scaffolding: backend/frontend folder skeletons, `requirements.txt`/`package.json`, linting config, empty CI-ready test runners, `.env.example`, `.gitignore` | A trivial "app imports and `/health` returns 200" test, just to prove the harness works |
| 1 | DB models + Alembic migration for `products`, `customers`, `orders`, `order_items` | Migration smoke test; model-level constraint tests (unique SKU/email at DB level, check constraints) |
| 2 | Product service + repository + API (`POST/GET/GET{id}/PUT/DELETE /products`) | Unit tests for create/list/get/update/delete + duplicate-SKU rejection; API tests for all five endpoints and their status codes |
| 3 | Customer service + repository + API (`POST/GET/GET{id}/DELETE /customers`) | Same pattern as Phase 2, plus duplicate-email rejection |
| 4 | Order service: total calculation, stock-sufficiency validation, atomic stock decrement, row locking | Unit tests: sufficient stock succeeds and decrements correctly; insufficient stock rejects and leaves stock untouched; concurrent-order race condition test |
| 5 | Order API (`POST/GET/GET{id}/DELETE /orders`) + cancellation restocking | API tests for all order endpoints including the 409 insufficient-stock case and the restock-on-cancel case |
| 6 | Dashboard endpoint + cross-cutting error handling / consistent error envelope | API tests asserting the summary numbers and the shape of error responses across all routers |
| 7 | Frontend scaffolding: Vite app, router, Tailwind, API client module, layout shell | Component test that the shell renders and routes to each page |
| 8 | Frontend Product management UI (list, add, edit, delete forms with validation) | Component tests for form validation, list rendering, and API-call assertions (MSW) |
| 9 | Frontend Customer management UI (list, add, delete) | Same pattern as Phase 8 |
| 10 | Frontend Order management UI (create order with multiple line items, list, detail view) + Dashboard page | Component/page tests including the insufficient-stock error path surfacing in the UI |
| 11 | Dockerization: backend Dockerfile, frontend Dockerfile, `.dockerignore`, `docker-compose.yml`, root `.env.example` | Manual verification checklist (`docker compose up` brings up all three services healthy; full smoke test via curl/browser) |
| 12 | CI (optional but recommended): GitHub Actions workflow running backend + frontend test suites on every push | Workflow file validated by a passing run |
| 13 | Deployment: Docker Hub push, backend deploy, frontend deploy, CORS wiring, production smoke test | Production smoke test checklist from section 12 |
| 14 | Final polish: README with setup/run/test/deploy instructions, screenshots, submission links | README review against the submission checklist below |

---

## 14. Submission Checklist

- [ ] GitHub repository link (frontend + backend code, README with run instructions)
- [ ] Docker Hub image link for the backend
- [ ] Live frontend URL (Vercel/Netlify)
- [ ] Live backend API URL (Render/Railway/Fly.io), including a working `/health` and `/docs` (FastAPI auto-docs)
- [ ] All business rules from section 6 verified against the **live** deployment, not just locally
