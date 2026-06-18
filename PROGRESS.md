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
| 1 | Data Model & Migrations | ⬜ Not Started | SQLAlchemy models, Alembic migration, constraint tests |
| 2 | Product Management (Backend) | ⬜ Not Started | CRUD + service + router + tests |
| 3 | Customer Management (Backend) | ⬜ Not Started | CRUD + service + router + tests |
| 4 | Order Business Logic | ⬜ Not Started | Stock validation, atomic decrement, race conditions |
| 5 | Order API + Dashboard | ⬜ Not Started | Order router, dashboard endpoint, cancel-restock |
| 6 | Cross-Cutting Error Handling | ⬜ Not Started | Global exception handlers, error envelope |
| 7 | Frontend Scaffolding | ⬜ Not Started | Already partially done in Phase 0 (router + layout shell) |
| 8 | Frontend: Product UI | ⬜ Not Started | ProductList, ProductForm, validation tests |
| 9 | Frontend: Customer UI | ⬜ Not Started | CustomerList, CustomerForm, validation tests |
| 10 | Frontend: Order UI + Dashboard | ⬜ Not Started | OrderForm, OrderList, Dashboard, low-stock table |
| 11 | Dockerization | ⬜ Not Started | Multi-stage builds, docker-compose.yml |
| 12 | CI (GitHub Actions) | ⏭️ Skipped | User decided to skip |
| 13 | Deployment | ⏭️ Skipped | User decided to skip — README instructions instead |
| 14 | Final Polish | ⬜ Not Started | README, submission checklist |

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
- Alembic initialization → Phase 1
- Database models → Phase 1
- Product/Customer/Order schemas, services, repositories, routers → Phases 2-5
- Frontend page implementations → Phases 8-10
- Docker setup → Phase 11

---

## 🔧 Current Working State

- **Current Phase**: Phase 0 ✅ Complete — Ready for Phase 1
- **Last Action**: All tests green (backend 1/1, frontend 3/3)
- **Next Action**: Phase 1 — Data Model & Migrations (SQLAlchemy models + Alembic)
- **Blocking Issues**: Need PostgreSQL running for Phase 1 (test DB for model constraint tests)

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
