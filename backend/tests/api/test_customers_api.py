"""
API tests for the Customers router.
"""

def test_create_customer(client):
    response = client.post(
        "/api/v1/customers",
        json={"full_name": "API Customer", "email": "api@test.com", "phone": "1234567890"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "API Customer"
    assert data["email"] == "api@test.com"
    assert "id" in data


def test_create_customer_duplicate_email(client):
    payload = {"full_name": "API Duplicate", "email": "api_dup@test.com", "phone": "123"}
    client.post("/api/v1/customers", json=payload)
    
    # Second request should fail with 409
    response = client.post("/api/v1/customers", json=payload)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"


def test_get_customer(client):
    create_resp = client.post(
        "/api/v1/customers",
        json={"full_name": "Get Cust", "email": "get_cust@test.com", "phone": "111"}
    )
    cust_id = create_resp.json()["id"]
    
    response = client.get(f"/api/v1/customers/{cust_id}")
    assert response.status_code == 200
    assert response.json()["id"] == cust_id


def test_get_customer_not_found(client):
    response = client.get("/api/v1/customers/999999")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_list_customers(client):
    client.post("/api/v1/customers", json={"full_name": "LC1", "email": "lc1@test.com", "phone": "1"})
    client.post("/api/v1/customers", json={"full_name": "LC2", "email": "lc2@test.com", "phone": "2"})
    
    response = client.get("/api/v1/customers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_delete_customer(client):
    create_resp = client.post(
        "/api/v1/customers",
        json={"full_name": "Del Cust", "email": "del_cust@test.com", "phone": "000"}
    )
    cust_id = create_resp.json()["id"]
    
    response = client.delete(f"/api/v1/customers/{cust_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    get_resp = client.get(f"/api/v1/customers/{cust_id}")
    assert get_resp.status_code == 404
