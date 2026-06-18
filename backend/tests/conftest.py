"""
Pytest configuration and shared fixtures for the backend test suite.

Provides:
- A test client fixture for making HTTP requests to the FastAPI app.
"""
from fastapi.testclient import TestClient

import pytest

from app.main import app


@pytest.fixture()
def client():
    """Create a test client for the FastAPI application."""
    with TestClient(app) as c:
        yield c
