"""
API tests for the Orders router.
"""


def test_create_order(client):
    # Setup customer and products
    cust_resp = client.post(
        "/api/v1/customers", json={"full_name": "C", "email": "o1@c.com", "phone": "1"}
    )
    cust_id = cust_resp.json()["id"]

    prod_resp = client.post(
        "/api/v1/products",
        json={"name": "P", "sku": "O-SKU1", "price": 10.0, "quantity_in_stock": 5},
    )
    prod_id = prod_resp.json()["id"]

    response = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 2}]},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["total_amount"] == 20.0
    assert len(data["items"]) == 1


def test_create_order_insufficient_stock(client):
    cust_resp = client.post(
        "/api/v1/customers", json={"full_name": "C", "email": "o2@c.com", "phone": "1"}
    )
    cust_id = cust_resp.json()["id"]

    prod_resp = client.post(
        "/api/v1/products",
        json={"name": "P", "sku": "O-SKU2", "price": 10.0, "quantity_in_stock": 1},
    )
    prod_id = prod_resp.json()["id"]

    response = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 2}]},
    )

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"
    assert "stock" in response.json()["error"]["message"].lower()


def test_get_order(client):
    cust_resp = client.post(
        "/api/v1/customers", json={"full_name": "C", "email": "o3@c.com", "phone": "1"}
    )
    cust_id = cust_resp.json()["id"]

    prod_resp = client.post(
        "/api/v1/products",
        json={"name": "P", "sku": "O-SKU3", "price": 10.0, "quantity_in_stock": 5},
    )
    prod_id = prod_resp.json()["id"]

    create_resp = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 1}]},
    )
    order_id = create_resp.json()["id"]

    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    assert response.json()["id"] == order_id


def test_list_orders(client):
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert isinstance(response.json()["items"], list)


def test_cancel_order(client):
    cust_resp = client.post(
        "/api/v1/customers", json={"full_name": "C", "email": "o4@c.com", "phone": "1"}
    )
    cust_id = cust_resp.json()["id"]

    prod_resp = client.post(
        "/api/v1/products",
        json={"name": "P", "sku": "O-SKU4", "price": 10.0, "quantity_in_stock": 5},
    )
    prod_id = prod_resp.json()["id"]

    create_resp = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 1}]},
    )
    order_id = create_resp.json()["id"]

    response = client.delete(f"/api/v1/orders/{order_id}")
    assert response.status_code == 204

    get_resp = client.get(f"/api/v1/orders/{order_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "cancelled"


def _setup_order(client, email, sku, status="pending"):
    """Helper: create a customer + product + order, return the order dict."""
    cust_id = client.post(
        "/api/v1/customers", json={"full_name": "Alice", "email": email, "phone": "1"}
    ).json()["id"]
    prod_id = client.post(
        "/api/v1/products",
        json={"name": "P", "sku": sku, "price": 10.0, "quantity_in_stock": 5},
    ).json()["id"]
    order = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 1}]},
    ).json()
    if status != "pending":
        if status == "cancelled":
            client.delete(f"/api/v1/orders/{order['id']}")
        order["status"] = status
    return order


def test_list_orders_filter_by_status(client):
    _setup_order(client, "f1@c.com", "FLT-SKU1", status="cancelled")
    _setup_order(client, "f2@c.com", "FLT-SKU2")

    response = client.get("/api/v1/orders?status=pending")
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "total", "skip", "limit"}
    assert all(o["status"] == "pending" for o in body["items"])
    assert len(body["items"]) >= 1

    response = client.get("/api/v1/orders?status=cancelled")
    assert response.status_code == 200
    assert all(o["status"] == "cancelled" for o in response.json()["items"])


def test_list_orders_rejects_invalid_status(client):
    response = client.get("/api/v1/orders?status=shipped")
    assert response.status_code == 422


def test_list_orders_filter_by_date_range_inclusive(client):
    order = _setup_order(client, "f3@c.com", "FLT-SKU3")
    created_date = order["created_at"][:10]

    response = client.get(f"/api/v1/orders?date_from={created_date}&date_to={created_date}")
    assert response.status_code == 200
    ids = [o["id"] for o in response.json()["items"]]
    assert order["id"] in ids


def test_list_orders_rejects_inverted_date_range(client):
    response = client.get("/api/v1/orders?date_from=2026-05-01&date_to=2026-01-01")
    assert response.status_code == 422


def test_search_matches_order_id(client):
    order = _setup_order(client, "f4@c.com", "FLT-SKU4")

    response = client.get(f"/api/v1/orders?q={order['id']}")
    assert response.status_code == 200
    assert any(o["id"] == order["id"] for o in response.json()["items"])


def test_search_matches_customer_name_case_insensitive(client):
    cust_id = client.post(
        "/api/v1/customers",
        json={"full_name": "Zephyrine Quandary", "email": "zq@c.com", "phone": "9"},
    ).json()["id"]
    prod_id = client.post(
        "/api/v1/products",
        json={"name": "P", "sku": "FLT-SKU5", "price": 10.0, "quantity_in_stock": 5},
    ).json()["id"]
    order = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 1}]},
    ).json()

    response = client.get("/api/v1/orders?q=zephyrine")
    assert response.status_code == 200
    assert any(o["id"] == order["id"] for o in response.json()["items"])


def test_filters_combine_with_and(client):
    order = _setup_order(client, "f5@c.com", "FLT-SKU6", status="cancelled")

    response = client.get(f"/api/v1/orders?status=cancelled&q={order['id']}")
    assert response.status_code == 200
    assert any(o["id"] == order["id"] for o in response.json()["items"])

    response = client.get(f"/api/v1/orders?status=pending&q={order['id']}")
    assert response.status_code == 200
    assert all(o["id"] != order["id"] for o in response.json()["items"])


def test_list_orders_pagination_envelope_and_slices(client):
    for i in range(3):
        _setup_order(client, f"pg{i}@c.com", f"PGO-SKU{i}")

    body = client.get("/api/v1/orders?skip=0&limit=2").json()
    assert set(body.keys()) == {"items", "total", "skip", "limit"}
    assert len(body["items"]) == 2
    assert (body["skip"], body["limit"]) == (0, 2)

    page2 = client.get("/api/v1/orders?skip=2&limit=2").json()
    assert len(page2["items"]) >= 1
    assert page2["total"] == body["total"]


def test_list_orders_total_respects_filters(client):
    cancelled = _setup_order(client, "tf1@c.com", "TFC-SKU1", status="cancelled")
    pending = _setup_order(client, "tf2@c.com", "TFC-SKU2")

    body = client.get("/api/v1/orders?status=pending&skip=0&limit=100").json()
    ids = [o["id"] for o in body["items"]]
    assert pending["id"] in ids
    assert cancelled["id"] not in ids
    assert body["total"] == len(body["items"])
