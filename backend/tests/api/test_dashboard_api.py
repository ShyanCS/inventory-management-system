"""
API tests for the Dashboard router.
"""

def test_dashboard_summary(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_products" in data
    assert "total_customers" in data
    assert "total_orders" in data
    assert "low_stock_products" in data
    assert isinstance(data["low_stock_products"], list)
