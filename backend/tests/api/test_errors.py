"""
Tests for global exception handlers.
"""

def test_app_exception_envelope(client):
    # Trigger a 404
    response = client.get("/api/v1/products/999999")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "code" in data["error"]
    assert "message" in data["error"]
    assert data["error"]["code"] == "NOT_FOUND"


def test_validation_error_envelope(client):
    # Trigger a 422 Unprocessable Entity (validation error)
    response = client.post("/api/v1/products", json={"name": "Bad Product", "price": -5})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "message" in data["error"]
    assert "details" in data["error"]
    assert isinstance(data["error"]["details"], list)


def test_internal_server_error_envelope(monkeypatch):
    # Mock the product service to raise a generic exception
    from app.routers import products
    from app.services.product_service import ProductService
    from fastapi.testclient import TestClient
    from app.main import app
    
    def mock_list(*args, **kwargs):
        raise Exception("Unexpected database failure")
        
    monkeypatch.setattr(ProductService, "list_products", mock_list)
    
    # We must set raise_server_exceptions=False so the test client returns 500
    # instead of bubbling the exception up into the test runner.
    client = TestClient(app, raise_server_exceptions=False)
    response = client.get("/api/v1/products")
    assert response.status_code == 500
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "INTERNAL_ERROR"
    assert data["error"]["message"] == "An unexpected error occurred."
