"""
Database engine and session management.

Provides:
- `engine`: SQLAlchemy engine connected to PostgreSQL.
- `SessionLocal`: Session factory for creating DB sessions.
- `get_db`: FastAPI dependency that yields a session per request.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, echo=(settings.environment == "development"))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db():
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
