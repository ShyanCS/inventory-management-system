# Contributing

Thanks for your interest in improving InvenTrack! This document covers
the workflow, conventions, and quality gates for contributing.

## Development Setup

Follow the [Local Development](README.md#%EF%B8%8F-local-development-without-docker)
section of the README. In short:

1. Copy `backend/.env.example` to `backend/.env` and adjust values.
2. Backend: `python -m venv .venv`, activate it,
   `pip install -r requirements-dev.txt`.
3. Frontend: `npm ci`.

## Branching & Commit Style

- Branch from `main`; keep branches short-lived and focused.
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` new feature
  - `fix:` bug fix
  - `test:` test-only change
  - `docs:` documentation only
  - `chore:` tooling/config (CI, deps)
  - `style:` formatting only
  - `refactor:` no behavior change
- **One logical change per commit.** A feature or fix and the tests that
  prove it belong in the same commit.
- Do not mix reformatting with behavior changes — run formatters in a
  separate `style:` commit.

## Quality Gates

All of these must pass before a PR can merge (CI enforces them):

| Check | Command | Location |
|---|---|---|
| Lint | `npm run lint` | `frontend/` |
| Format | `npm run format:check` | `frontend/` |
| Tests + coverage | `npm run test:coverage` | `frontend/` |
| Build | `npm run build` | `frontend/` |
| Lint + format | `ruff check . && ruff format --check .` | `backend/` |
| Tests + coverage | `pytest --cov=app --cov-fail-under=80` | `backend/` |
| Dependency audit | `npm audit --audit-level=high` / `pip-audit` | CI |

Coverage below 80% lines on either suite fails the build.

## Testing Expectations

- New features ship with tests covering both the happy path and at least
  one failure path.
- Bug fixes ship with a regression test that fails without the fix.
- Frontend tests use Vitest + React Testing Library with MSW handlers;
  add per-route MSW overrides (`server.use(...)`) to simulate API errors.
- Backend tests use pytest with an isolated transactional session; see
  `backend/tests/conftest.py`.
