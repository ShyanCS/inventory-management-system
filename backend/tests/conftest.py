"""
Pytest configuration and shared fixtures for the backend test suite.

Provides:
- A test database (SQLite in-memory for local dev, Postgres for CI).
- A test DB session fixture for unit tests.
- A test client fixture for API tests.
"""
import os

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

import pytest

# Use SQLite in-memory for tests by default (no Postgres required locally).
# Set TEST_DATABASE_URL env var to use a real Postgres for integration tests.
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in TEST_DATABASE_URL else {},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before the test session, drop them after."""
    from app.core.database import Base
    # Import all models so they register with Base.metadata
    import app.models.product  # noqa: F401
    import app.models.customer  # noqa: F401
    import app.models.order  # noqa: F401

    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    # Clean up SQLite file if used
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass


@pytest.fixture()
def db_session():
    """Provide a transactional DB session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # For SQLite, enable nested transactions (savepoints)
    if "sqlite" in TEST_DATABASE_URL:
        @event.listens_for(session, "after_transaction_end")
        def restart_savepoint(session, transaction):
            if transaction.nested and not transaction._parent.nested:
                session.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """Create a test client that uses the test DB session."""
    from app.main import app
    from app.core.database import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
