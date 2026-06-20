# InvenTrack — Inventory Management System

A production-ready, full-stack Inventory and Order Management System built with React, FastAPI, and PostgreSQL.

## 🚀 Features

- **Dashboard**: High-level overview of total products, customers, and orders, along with a live low-stock alert table.
- **Product Management**: Track inventory levels, prices, and SKUs with conflict prevention.
- **Customer Management**: Register customers with email format validation.
- **Order Processing**: 
  - Dynamic multi-line item order creation with live total calculation.
  - Strict atomic database transactions using `SELECT FOR UPDATE` to prevent inventory race conditions.
  - Automatic stock deduction upon order creation and restocking upon order cancellation.
- **TDD-First Development**: Built via strict Red-Green-Refactor cycles with **93 automated tests** (60 backend, 33 frontend).
- **Dockerized**: Fully containerized with `docker-compose` for 1-click startup, multi-stage builds, and an Nginx reverse proxy.

## 🏗️ Tech Stack

### Frontend
- React 18 + Vite
- React Router DOM for SPA routing
- Tailwind CSS (v3) for styling
- Axios for API communication
- Vitest + React Testing Library + MSW (Mock Service Worker)

### Backend
- Python 3.12 + FastAPI
- SQLAlchemy 2.0 (Synchronous ORM with row-level locking)
- PostgreSQL (via `psycopg2-binary`)
- Alembic for database migrations
- Pytest for API and Unit testing

---

## 🏃 Getting Started (Docker)

The fastest way to run the application is via Docker Compose. This spins up the PostgreSQL database, the FastAPI backend, and the React/Nginx frontend.

### Prerequisites
- Docker and Docker Compose installed.

### Run Instructions
1. Open a terminal in the root directory.
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
   *(Or `docker compose up --build` depending on your Docker version).*
3. The database will automatically initialize and run all Alembic migrations via the backend's entrypoint script.
4. Access the application:
   - **Frontend UI**: [http://localhost](http://localhost) (or [http://localhost:3000](http://localhost:3000))
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Local Development (Without Docker)

If you prefer to run the services directly on your host machine for development:

### 1. Database
Ensure you have a PostgreSQL instance running. Create a database named `inventory` and a user.
```sql
CREATE DATABASE inventory;
CREATE USER inventory_user WITH PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE inventory TO inventory_user;
```

### 2. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

The project contains a comprehensive test suite.

### Backend Tests (60 tests)
Uses `pytest` with an isolated test database session. Tests cover all router endpoints, service logic, concurrency locking, and repository transactions.
```bash
cd backend
source .venv/bin/activate
pytest
```

### Frontend Tests (33 tests)
Uses `vitest` and `@testing-library/react`. Tests simulate real user interactions and mock all network requests via MSW.
```bash
cd frontend
npm run test
```

---

## 📂 Project Structure

```
.
├── docker-compose.yml       # Root orchestration file
├── PROGRESS.md              # Detailed log of the 11-phase development process
├── PROJECT_SPECIFICATION.md # Original architectural design document
├── backend/                 # FastAPI Application
│   ├── alembic/             # Migration scripts
│   ├── app/                 # Application code (models, schemas, routers, services)
│   ├── tests/               # Pytest suite
│   ├── Dockerfile           # Multi-stage python build
│   └── entrypoint.sh        # Startup script for migrations
└── frontend/                # React Application
    ├── public/              # Static assets
    ├── src/                 # Application code (components, pages, hooks, api)
    ├── tests/               # Vitest suite with MSW mocks
    ├── Dockerfile           # Multi-stage Vite build + Nginx runtime
    └── nginx.conf           # Nginx reverse proxy configuration
```
