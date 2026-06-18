"""
Phase 0 — Health endpoint test.

TDD Red: This test is written BEFORE the /health endpoint exists.
It should fail with an ImportError (app.main doesn't define `app` yet)
or a 404 (if app exists but no route is registered).
"""


def test_health_returns_200(client):
    """GET /health should return 200 with a JSON body indicating healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
