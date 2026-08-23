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
    assert set(data.keys()) == {"items", "total", "skip", "limit"}
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 2
    assert data["total"] >= 2


def test_list_products_pagination_slices_and_total(client):
    for i in range(5):
        client.post(
            "/api/v1/products",
            json={"name": f"PG{i}", "sku": f"PG-SKU{i}", "price": 1, "quantity_in_stock": 50},
        )

    page1 = client.get("/api/v1/products?skip=0&limit=2").json()
    page2 = client.get("/api/v1/products?skip=2&limit=2").json()

    assert len(page1["items"]) == 2
    assert len(page2["items"]) == 2
    assert page1["items"][0]["id"] != page2["items"][0]["id"]
    # total ignores pagination but respects the low_stock filter
    assert page1["total"] == page2["total"] >= 5

    low = client.get("/api/v1/products?low_stock=true&skip=0&limit=100").json()
    assert low["total"] == sum(1 for p in low["items"])


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

    response = client.put(f"/api/v1/products/{product_id}", json={"low_stock_threshold": 2})
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
        json={
            "name": "A",
            "sku": "LOW-A",
            "price": 1,
            "quantity_in_stock": 8,
            "low_stock_threshold": 10,
        },
    )
    client.post(
        "/api/v1/products",
        json={
            "name": "B",
            "sku": "LOW-B",
            "price": 1,
            "quantity_in_stock": 8,
            "low_stock_threshold": 5,
        },
    )
    client.post(
        "/api/v1/products",
        json={
            "name": "C",
            "sku": "LOW-C",
            "price": 1,
            "quantity_in_stock": 20,
            "low_stock_threshold": 25,
        },
    )

    response = client.get("/api/v1/products?low_stock=true")
    assert response.status_code == 200
    skus = {p["sku"] for p in response.json()["items"]}
    assert {"LOW-A", "LOW-C"} <= skus
    assert "LOW-B" not in skus


def test_export_returns_csv_content_type_and_disposition(client):
    response = client.get("/api/v1/products/export")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    disposition = response.headers["content-disposition"]
    assert "attachment" in disposition
    assert "products_" in disposition
    assert disposition.rstrip('"').endswith(".csv") or ".csv" in disposition


def test_export_contains_header_and_all_products(client):
    client.post("/api/v1/products", json={"name": "Exp One", "sku": "EXP-001", "price": 5})
    client.post("/api/v1/products", json={"name": "Exp Two", "sku": "EXP-002", "price": 7.5})

    response = client.get("/api/v1/products/export")
    lines = response.text.strip().splitlines()
    assert lines[0] == "id,name,sku,price,quantity_in_stock,low_stock_threshold,created_at"
    skus = ",".join(lines)
    assert "EXP-001" in skus
    assert "EXP-002" in skus


def test_export_respects_low_stock_filter(client):
    client.post(
        "/api/v1/products",
        json={"name": "Stocked", "sku": "EXPL-001", "price": 5, "quantity_in_stock": 100},
    )
    client.post(
        "/api/v1/products",
        json={"name": "Scarce", "sku": "EXPL-002", "price": 5, "quantity_in_stock": 2},
    )

    response = client.get("/api/v1/products/export?low_stock=true")
    body = response.text
    assert "EXPL-002" in body
    assert "EXPL-001" not in body


def test_export_ignores_pagination_params(client):
    for i in range(4):
        client.post(
            "/api/v1/products",
            json={"name": f"Bulk {i}", "sku": f"EXPB-{i}", "price": 5},
        )

    response = client.get("/api/v1/products/export?skip=0&limit=2")
    rows = response.text.strip().splitlines()
    # header + all 4 products despite limit=2
    assert len(rows) >= 5


def test_get_product_still_works_after_export_route_added(client):
    create_resp = client.post(
        "/api/v1/products", json={"name": "Route Check", "sku": "RT-001", "price": 5}
    )
    product_id = create_resp.json()["id"]

    response = client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Route Check"
