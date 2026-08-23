"""
API tests for the Products router.
"""


def test_create_product(client):
    response = client.post(
        "/api/v1/products",
        json={"name": "API Mouse", "sku": "API-001", "price": 25.50, "quantity_in_stock": 10},
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
    create_resp = client.post(
        "/api/v1/products", json={"name": "Get Me", "sku": "GET-001", "price": 5}
    )
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
    create_resp = client.post(
        "/api/v1/products", json={"name": "Old", "sku": "UPD-001", "price": 5}
    )
    product_id = create_resp.json()["id"]

    response = client.put(
        f"/api/v1/products/{product_id}", json={"name": "New Name", "price": 10.0}
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"
    assert response.json()["price"] == 10.0


def test_delete_product(client):
    create_resp = client.post(
        "/api/v1/products", json={"name": "Delete Me", "sku": "DEL-001", "price": 5}
    )
    product_id = create_resp.json()["id"]

    response = client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 204

    # Verify it's gone
    get_resp = client.get(f"/api/v1/products/{product_id}")
    assert get_resp.status_code == 404


def test_create_product_defaults_low_stock_threshold(client):
    response = client.post(
        "/api/v1/products", json={"name": "Default Thr", "sku": "THR-001", "price": 5}
    )
    assert response.status_code == 201
    assert response.json()["low_stock_threshold"] == 10


def test_create_product_with_custom_threshold(client):
    response = client.post(
        "/api/v1/products",
        json={"name": "Custom Thr", "sku": "THR-002", "price": 5, "low_stock_threshold": 3},
    )
    assert response.status_code == 201
    assert response.json()["low_stock_threshold"] == 3


def test_update_product_threshold(client):
    create_resp = client.post(
        "/api/v1/products", json={"name": "Upd Thr", "sku": "THR-003", "price": 5}
    )
    product_id = create_resp.json()["id"]

    response = client.put(
        f"/api/v1/products/{product_id}", json={"low_stock_threshold": 2}
    )
    assert response.status_code == 200
    assert response.json()["low_stock_threshold"] == 2


def test_reject_negative_threshold(client):
    response = client.post(
        "/api/v1/products",
        json={"name": "Neg Thr", "sku": "THR-004", "price": 5, "low_stock_threshold": -1},
    )
    assert response.status_code == 422


def test_reject_threshold_above_cap(client):
    response = client.post(
        "/api/v1/products",
        json={"name": "Cap Thr", "sku": "THR-005", "price": 5, "low_stock_threshold": 10001},
    )
    assert response.status_code == 422


def test_low_stock_uses_per_product_thresholds(client):
    # A: stock 8 <= threshold 10 -> low; B: stock 8 > threshold 5 -> not low;
    # C: stock 20 <= threshold 25 -> low
    client.post(
        "/api/v1/products",
        json={"name": "A", "sku": "LOW-A", "price": 1, "quantity_in_stock": 8, "low_stock_threshold": 10},
    )
    client.post(
        "/api/v1/products",
        json={"name": "B", "sku": "LOW-B", "price": 1, "quantity_in_stock": 8, "low_stock_threshold": 5},
    )
    client.post(
        "/api/v1/products",
        json={"name": "C", "sku": "LOW-C", "price": 1, "quantity_in_stock": 20, "low_stock_threshold": 25},
    )

    response = client.get("/api/v1/products?low_stock=true")
    assert response.status_code == 200
    skus = {p["sku"] for p in response.json()}
    assert {"LOW-A", "LOW-C"} <= skus
    assert "LOW-B" not in skus


def test_list_products_rejects_global_threshold_param(client):
    response = client.get("/api/v1/products?threshold=5")
    assert response.status_code == 422
