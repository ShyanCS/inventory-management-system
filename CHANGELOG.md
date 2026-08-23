# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-08-23

### Added
- GitHub Actions CI pipeline with frontend (lint, format check, tests, build),
  backend (ruff lint/format, pytest), and dependency-audit jobs.
- Coverage gating at 80% lines for both suites
  (frontend currently ~84%, backend ~94%).
- Structured JSON logging on the backend (`app/core/logging_config.py`)
  with request-logging middleware and log-level configuration.
- Prettier formatting for the frontend, enforced via `npm run format:check`.
- Ruff linting/formatting for the backend, enforced in CI.
- `pip-audit` and `npm audit --audit-level=high` steps in CI.
- Pinned development dependencies (`backend/requirements-dev.txt`).
- `TEST_DATABASE_URL` documented in `backend/.env.example`.
- Error banners on product deletion and order cancellation failures,
  replacing silently swallowed exceptions, with regression tests.
- `CHANGELOG.md`, `CONTRIBUTING.md`, and this release.

### Fixed
- Frontend test suite restored to green after the navbar/dashboard redesign
  (App shell and DashboardPage tests now match current UI).
- All ESLint violations resolved (unused imports, synchronous setState
  in effects replaced with React-endorsed patterns).
- All Ruff violations resolved (import order, exception chaining, line length).
- High-severity npm dependency vulnerabilities patched.
- Backend dependencies upgraded (fastapi, starlette, pytest) to clear
  known security advisories; pip-audit reports no known vulnerabilities.
- README tech-stack versions corrected (React 19, Tailwind CSS v4);
  install instructions switched to reproducible `npm ci`.

## [0.1.0]

### Added
- Full inventory management system: products, customers, orders,
  dashboard with low-stock alerts.
- Atomic order creation with row-level locking and stock restocking
  on cancellation.
- Docker Compose setup with Alembic migrations on startup.
- Test suites: 65 backend (pytest), 35 frontend (vitest + MSW).
