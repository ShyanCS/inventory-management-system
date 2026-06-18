# Inventory & Order Management System — Implementation Plan

## Project Overview

Build a production-shaped **Inventory & Order Management System** with:
- **Backend**: Python/FastAPI + PostgreSQL (SQLAlchemy 2.0 + Alembic)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Infrastructure**: Docker Compose, CI/CD, Deployment to Render/Vercel

Following **strict TDD** (Red → Green → Refactor) across all 15 phases.

---

## Open Questions

> [!IMPORTANT]
> **Database driver choice**: The spec allows either `psycopg` (v3) or `asyncpg`. I plan to use **synchronous SQLAlchemy with `psycopg2-binary`** for simpler testing (no async test complexity), while still supporting FastAPI's async endpoints via background thread execution. Is this acceptable, or do you prefer fully async with `asyncpg`?

> [!IMPORTANT]
> **Primary key type**: The spec says "UUID (or SERIAL)". I plan to use **integer SERIAL** primary keys for simplicity and performance, since the spec allows it. Do you prefer UUIDs?

> [!IMPORTANT]
> **Phase 12 (CI)**: The spec says "recommended, ask me first if you want to skip it." Should I include CI/GitHub Actions, or skip it?

> [!IMPORTANT]
> **Phase 13 (Deployment)**: This requires real external accounts (Docker Hub, Render, Vercel). Should I prepare deployment configs but stop before actually deploying, or do you have accounts ready?

---

## Proposed Changes

### Phase 0 — Repository Scaffolding

#### [NEW] `.gitignore`
Standard Python + Node.js gitignore, including `.env`, `__pycache__`, `node_modules`, `.venv`, etc.

#### [NEW] `backend/requirements.txt`
FastAPI, SQLAlchemy 2.0, Alembic, pydantic-settings, psycopg2-binary, pytest, pytest-asyncio, httpx, uvicorn.

#### [NEW] `backend/.env.example`
Placeholder values for `DATABASE_URL`, `POSTGRES_*`, `BACKEND_CORS_ORIGINS`, `ENVIRONMENT`.

#### [NEW] `backend/app/__init__.py`, `backend/app/main.py`
Minimal FastAPI app with `/health` endpoint returning 200.

#### [NEW] `backend/app/core/config.py`
pydantic-settings `Settings` class loading from env vars.

#### [NEW] `backend/app/core/database.py`
SQLAlchemy engine + session factory (initially stubbed).

#### [NEW] `backend/app/core/__init__.py`, models/, schemas/, repositories/, services/, routers/ `__init__.py` files
Empty package init files to establish project structure.

#### [NEW] `backend/tests/conftest.py`
Pytest fixtures for test DB session and test client.

#### [NEW] `backend/tests/test_health.py`
**TDD**: First write a failing test that `GET /health` returns 200, then implement.

---

#### [NEW] `frontend/package.json`
React 18, Vite, React Router v6, Axios, Tailwind CSS, Vitest, React Testing Library, MSW.

#### [NEW] `frontend/.env.example`
`VITE_API_BASE_URL=http://localhost:8000/api/v1`

#### [NEW] `frontend/src/App.jsx`
Minimal app shell with React Router setup and navigation links.

#### [NEW] `frontend/src/main.jsx`
React entry point.

#### [NEW] `frontend/index.html`
HTML template for Vite.

#### [NEW] `frontend/vite.config.js`, `frontend/tailwind.config.js`
Build configuration files.

#### [NEW] `frontend/tests/setup.js`
Vitest + MSW setup.

#### [NEW] `frontend/tests/App.test.jsx`
**TDD**: Smoke test that the app shell renders.

---

### Phase 1 — Data Model & Migrations

- SQLAlchemy models for `products`, `customers`, `orders`, `order_items` matching spec section 4 exactly
- Alembic initial migration
- Tests: duplicate SKU integrity error, duplicate email integrity error, negative stock rejected, migration applies cleanly

### Phase 2 — Product Management (Backend)

- `product_repository.py` — CRUD operations
- `product_service.py` — business logic (duplicate SKU check, not-found handling)
- `routers/products.py` — REST endpoints per spec 5.1
- Unit tests for service, API tests for all 5 endpoints

### Phase 3 — Customer Management (Backend)

- Same pattern as Phase 2 for `/customers`
- Duplicate email rejection, 409-on-delete-with-orders (deferred test with TODO)

### Phase 4 — Order Business Logic

- `order_service.py` with stock validation, atomic decrement, price snapshot, total computation
- Tests: sufficient stock, insufficient stock (full rejection), price snapshot, concurrent race condition, cancel restores stock

### Phase 5 — Order API + Dashboard

- `/orders` router, `/dashboard/summary` endpoint
- API tests for all order endpoints, un-skip customer "has orders" test

### Phase 6 — Cross-Cutting Error Handling

- Global FastAPI exception handlers → consistent error envelope
- Tests asserting all error paths return the same envelope shape

### Phase 7–10 — Frontend (Products, Customers, Orders, Dashboard)

- React components with MSW-mocked API tests
- Form validation, error state handling, optimistic UI updates

### Phase 11 — Dockerization

- Multi-stage Dockerfiles, docker-compose.yml, manual verification

### Phase 12–14 — CI, Deployment, Final Polish

- GitHub Actions, deployment configs, README

---

## Verification Plan

### Automated Tests
- `cd backend && pytest -v` — full backend test suite after each phase
- `cd frontend && npm test` — full frontend test suite after each phase

### Manual Verification
- Phase 11: `docker compose up --build` and smoke test through browser
- Phase 13: Production smoke test against live URLs
