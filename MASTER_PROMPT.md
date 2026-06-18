# Master Build Prompt — Inventory & Order Management System

> Copy everything below into your AI IDE / coding agent (Claude Code, Cursor, Windsurf, etc.) as the first instruction in a fresh repository. Place `PROJECT_SPECIFICATION.md` in the repo root first — this prompt refers to it constantly.

---

You are an expert full-stack engineer building a production-shaped **Inventory & Order Management System** for a technical assessment. A complete specification is checked into the repo at `PROJECT_SPECIFICATION.md` — read it in full before writing any code, and re-read the relevant section before each phase below.

## Non-negotiable operating rules

1. **Strict TDD.** For every piece of behavior: write a failing test first, run it and confirm it fails (and *why* it fails), then write the minimum code to make it pass, then refactor while keeping the suite green. Never write implementation code before its test exists. Never mark a phase done with red tests anywhere in the suite, not just the new ones.
2. **Work in the phase order below, one phase at a time.** Do not jump ahead to frontend work while backend phases are incomplete, and do not start Docker/deployment work until all application phases are green. After finishing a phase: run the full test suite, show me the results, and commit with a conventional commit message before moving on.
3. **No hardcoded secrets, ever.** All credentials and environment-specific values come from environment variables, sourced from `.env` (gitignored) locally and from the hosting platform's secret manager in production. Commit `.env.example` files with placeholder values instead.
4. **Follow the data model and API contract in `PROJECT_SPECIFICATION.md` exactly** (table names, field names, status codes, error envelope shape) unless you find a concrete bug in the spec — if so, stop and tell me what you'd change and why, rather than silently deviating.
5. **Enforce every rule in spec section 6 (Business Logic Rules) at the service layer**, not just in the database — the DB constraints are a backstop, not the primary defense, because we want clean 409/422 responses, not raw database errors leaking to the client.
6. **Keep layers separate**: routers only translate HTTP ↔ schemas ↔ services; services hold business logic; repositories hold raw data access. Don't let SQLAlchemy queries leak into routers, and don't let HTTP concerns leak into services.
7. **Ask before doing anything irreversible or costly**: pushing to Docker Hub, creating cloud resources, or deploying. Everything else, proceed autonomously and report back.
8. If you get stuck or a test seems to reveal a spec ambiguity, **stop and ask**, rather than guessing silently and moving on.

## Definition of "done" for every phase

- A failing test existed before the implementation.
- The implementation makes it (and everything else) pass.
- All relevant edge cases/business rules from spec section 6 that apply to this phase are covered by tests.
- The full backend and/or frontend test suite is green, not just the new tests.
- A commit exists for the phase with a clear message.
- You give me a short summary: what was built, what's tested, what's deliberately deferred to a later phase.

---

## Phase 0 — Repository scaffolding

Set up `backend/` and `frontend/` folder skeletons matching the structures in spec sections 7 and 8. Initialize `requirements.txt` (FastAPI, SQLAlchemy 2.0, Alembic, pydantic-settings, psycopg or asyncpg, pytest, pytest-asyncio, httpx) and `package.json` (React 18, Vite, React Router, Axios, Tailwind, Vitest, React Testing Library, MSW). Add `.gitignore`, `.env.example` for both services. Write one trivial backend test that imports the FastAPI app and asserts `GET /health` returns 200, and confirm it fails first (app doesn't exist yet), then create the minimal app to pass it. Same idea on the frontend: one smoke test that the app shell renders.

## Phase 1 — Data model & migrations

Write the SQLAlchemy models for `products`, `customers`, `orders`, `order_items` exactly as specified in spec section 4, including all constraints. Write the first Alembic migration. Before writing the models, write tests that assert: a duplicate SKU raises an integrity error, a duplicate email raises an integrity error, negative stock is rejected at the DB level, and the migration applies cleanly to a fresh test database.

## Phase 2 — Product management (backend)

Implement `product_repository.py`, `product_service.py`, and the `/products` router per spec section 5.1. Test-first, in this order: unit tests for the service (create, list, get-by-id, update, delete, duplicate-SKU rejection, not-found handling), then API tests hitting all five endpoints and asserting status codes and bodies match the spec, including the 409 duplicate-SKU case and the 404 case.

## Phase 3 — Customer management (backend)

Same pattern as Phase 2, for `/customers` per spec section 5.2, including duplicate-email rejection and the 409-on-delete-if-has-orders rule (you'll only be able to fully test the "has orders" branch once Phase 5 exists — stub or defer that specific case with a clear `# TODO(phase 5)` and a skipped test rather than faking it).

## Phase 4 — Order business logic (the core of this assessment)

Before touching the API, build out `order_service.py` and test it in isolation against the test DB session. Required test cases, all written before the corresponding code:
- Creating an order with sufficient stock succeeds, decrements stock correctly for every line item, and computes `total_amount` correctly from `quantity * unit_price`.
- Creating an order where *any* line item exceeds available stock rejects the *entire* order and leaves stock for *all* products in that order untouched (no partial decrement).
- `unit_price` on each order item is captured as a snapshot of the product's price at creation time.
- Two concurrent attempts to order the last unit of a product: exactly one succeeds, the other gets a clean insufficient-stock rejection (simulate this with two sessions / a row-lock test, per spec section 6 rule 6).
- Cancelling an order restores the cancelled quantities to product stock.

## Phase 5 — Order API + dashboard

Implement the `/orders` router and `/dashboard/summary` per spec sections 5.3–5.4, wiring up `order_service.py`. API tests for every endpoint and status code in the spec, including the 409 insufficient-stock response shape (spec section 5.6) and the restock-on-cancel behavior end-to-end through the API. Go back and un-skip the Phase 3 "customer has orders" test now that orders exist.

## Phase 6 — Cross-cutting error handling

Implement the consistent error envelope from spec section 5.6 as global FastAPI exception handlers, replacing any ad hoc error responses from earlier phases. Write tests asserting every error path across all three routers now returns the same envelope shape.

## Phase 7 — Frontend scaffolding

Set up the Vite + React Router + Tailwind shell, the centralized API client module (base URL from `VITE_API_BASE_URL`), and the layout components, per spec section 8. Test-first: a component test asserting the shell renders navigation and routes correctly to each page stub.

## Phase 8 — Frontend: Product management UI

Build `ProductList`, `ProductForm`, and the products page. Test-first with MSW mocking the API: form validation (required fields, positive price, non-negative stock), successful create/update/delete updating the list, and error states (e.g., duplicate SKU 409 surfaces as a visible error message, not a silent failure).

## Phase 9 — Frontend: Customer management UI

Same pattern as Phase 8 for customers, including the duplicate-email error path.

## Phase 10 — Frontend: Order management UI + Dashboard

Build the order creation form (select customer, add multiple product line items with quantities, see a live computed total before submit, but always trust the server's returned total as the source of truth), the orders list/detail views, and the dashboard summary cards + low-stock table. Test-first, including the case where the backend returns a 409 insufficient-stock error and the form surfaces it clearly without losing the user's input.

## Phase 11 — Dockerization

Write the backend Dockerfile (multi-stage, slim, non-root user, healthcheck), the frontend Dockerfile (multi-stage, nginx, SPA fallback routing), both `.dockerignore` files, and the root `docker-compose.yml` wiring `db` + `backend` + `frontend` with a named Postgres volume, per spec section 10. Verify manually: `docker compose up --build` brings up all three services healthy, migrations run automatically, and you can create a product/customer/order through the running frontend talking to the running backend talking to the running database. Report the verification steps you ran and their results.

## Phase 12 — CI (recommended, ask me first if you want to skip it)

Add a GitHub Actions workflow that spins up Postgres as a service container and runs the full backend and frontend test suites on every push. Confirm it passes on a real push before calling this phase done.

## Phase 13 — Deployment

**Stop and confirm with me before doing anything here** — these steps touch real external accounts (Docker Hub, Render/Railway/Fly.io, Vercel/Netlify). Once confirmed, follow spec section 12 step by step: push the backend image to Docker Hub, deploy the backend with environment variables set (never hardcoded), deploy the frontend with `VITE_API_BASE_URL` pointing at the live backend, fix CORS to allow the deployed frontend's exact origin, then run the production smoke test from spec section 12.6 and report the results with the actual URLs.

## Phase 14 — Final polish

Write the root `README.md`: project description, architecture summary, local setup (`docker compose up`), how to run tests, environment variable reference, and the live links. Walk through the submission checklist in spec section 14 and confirm every box is genuinely checked against the live deployment, not just local.

---

Start now with Phase 0. Show me the failing test, then the passing implementation, then stop and wait for my go-ahead before Phase 1.
