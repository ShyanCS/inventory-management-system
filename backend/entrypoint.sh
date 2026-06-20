#!/bin/sh
# entrypoint.sh — Run Alembic migrations then start the app.
# Exits immediately if any command fails.
set -e

echo "==> Running Alembic migrations..."
alembic upgrade head

echo "==> Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
