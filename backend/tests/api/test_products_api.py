"""
API tests for the Products router.
"""

def test_create_product(client):
    response = client.post(
        "/api/v1/products",
        json={"name": "API Mouse", "sku": "API-001", "price": 25.50, "quantity_in_stock": 10}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "API Mouse"
    assert data["sku"] == "API-001"
    assert data["price"] == 25.50
    assert data["quantity_in_stock"] == 10
    assert "id" in data


def test_create_product_duplicate_sku(client):
    payload = {"name": "API Keyboard", "sku": "API-002", "price": 50.0}
    client.post("/api/v1/products", json=payload)
    
    # Second request should fail with 409
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "CONFLICT"


def test_get_product(client):
    create_resp = client.post("/api/v1/products", json={"name": "Get Me", "sku": "GET-001", "price": 5})
    product_id = create_resp.json()["id"]
    
    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["id"] == product_id


def test_get_product_not_found(client):
    response = client.get("/api/v1/products/999999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_list_products(client):
    client.post("/api/v1/products", json={"name": "L1", "sku": "LIST-001", "price": 1})
    client.post("/api/v1/products", json={"name": "L2", "sku": "LIST-002", "price": 1})
    
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_update_product(client):
    create_resp = client.post("/api/v1/products", json={"name": "Old", "sku": "UPD-001", "price": 5})
    product_id = create_resp.json()["id"]
    
    response = client.put(
        f"/api/v1/products/{product_id}",
        json={"name": "New Name", "price": 10.0}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert response.json()["price"] == 10.0


def test_delete_product(client):
    create_resp = client.post("/api/v1/products", json={"name": "Delete Me", "sku": "DEL-001", "price": 5})
    product_id = create_resp.json()["id"]
    
    response = client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_resp = client.get(f"/api/v1/products/{product_id}")
    assert get_resp.status_code == 404
