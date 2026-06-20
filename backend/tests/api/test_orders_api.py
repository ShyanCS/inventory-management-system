"""
API tests for the Orders router.
"""

def test_create_order(client):
    # Setup customer and products
    cust_resp = client.post("/api/v1/customers", json={"full_name": "C", "email": "o1@c.com", "phone": "1"})
    cust_id = cust_resp.json()["id"]
    
    prod_resp = client.post("/api/v1/products", json={"name": "P", "sku": "O-SKU1", "price": 10.0, "quantity_in_stock": 5})
    prod_id = prod_resp.json()["id"]
    
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": cust_id,
            "items": [{"product_id": prod_id, "quantity": 2}]
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["total_amount"] == 20.0
    assert len(data["items"]) == 1


def test_create_order_insufficient_stock(client):
    cust_resp = client.post("/api/v1/customers", json={"full_name": "C", "email": "o2@c.com", "phone": "1"})
    cust_id = cust_resp.json()["id"]
    
    prod_resp = client.post("/api/v1/products", json={"name": "P", "sku": "O-SKU2", "price": 10.0, "quantity_in_stock": 1})
    prod_id = prod_resp.json()["id"]
    
    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": cust_id,
            "items": [{"product_id": prod_id, "quantity": 2}]
        }
    )
    
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"
    assert "stock" in response.json()["error"]["message"].lower()


def test_get_order(client):
    cust_resp = client.post("/api/v1/customers", json={"full_name": "C", "email": "o3@c.com", "phone": "1"})
    cust_id = cust_resp.json()["id"]
    
    prod_resp = client.post("/api/v1/products", json={"name": "P", "sku": "O-SKU3", "price": 10.0, "quantity_in_stock": 5})
    prod_id = prod_resp.json()["id"]
    
    create_resp = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 1}]}
    )
    order_id = create_resp.json()["id"]
    
    response = client.get(f"/api/v1/orders/{order_id}")
    assert response.status_code == 200
    assert response.json()["id"] == order_id


def test_list_orders(client):
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_cancel_order(client):
    cust_resp = client.post("/api/v1/customers", json={"full_name": "C", "email": "o4@c.com", "phone": "1"})
    cust_id = cust_resp.json()["id"]
    
    prod_resp = client.post("/api/v1/products", json={"name": "P", "sku": "O-SKU4", "price": 10.0, "quantity_in_stock": 5})
    prod_id = prod_resp.json()["id"]
    
    create_resp = client.post(
        "/api/v1/orders",
        json={"customer_id": cust_id, "items": [{"product_id": prod_id, "quantity": 1}]}
    )
    order_id = create_resp.json()["id"]
    
    response = client.delete(f"/api/v1/orders/{order_id}")
    assert response.status_code == 204
    
    get_resp = client.get(f"/api/v1/orders/{order_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["status"] == "cancelled"
