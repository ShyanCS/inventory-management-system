"""
Unit tests for the Product Service.
TDD Red Phase: Written before the service is implemented.
"""
import pytest

from app.services.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import ConflictException, NotFoundException


def test_create_product(db_session):
    service = ProductService(db_session)
    create_dto = ProductCreate(
        name="Test Product",
        sku="TEST-001",
        price=10.00,
        quantity_in_stock=5
    )
    product = service.create_product(create_dto)
    
    assert product.id is not None
    assert product.name == "Test Product"
    assert product.sku == "TEST-001"
    assert product.price == 10.00
    assert product.quantity_in_stock == 5


def test_create_product_duplicate_sku(db_session):
    service = ProductService(db_session)
    create_dto = ProductCreate(
        name="Test Product",
        sku="TEST-002",
        price=10.00,
        quantity_in_stock=5
    )
    service.create_product(create_dto)
    
    # Second creation with same SKU should raise ConflictException
    with pytest.raises(ConflictException) as exc:
        service.create_product(create_dto)
    
    assert "SKU" in str(exc.value)


def test_get_product(db_session):
    service = ProductService(db_session)
    create_dto = ProductCreate(name="P", sku="TEST-003", price=5.0)
    created = service.create_product(create_dto)
    
    fetched = service.get_product(created.id)
    assert fetched.id == created.id
    assert fetched.sku == "TEST-003"


def test_get_product_not_found(db_session):
    service = ProductService(db_session)
    with pytest.raises(NotFoundException):
        service.get_product(99999)


def test_list_products(db_session):
    service = ProductService(db_session)
    # Clear existing if any (test DB isolation should handle this, but just in case)
    # Actually, tests run in transactions, so it's clean.
    service.create_product(ProductCreate(name="A", sku="A-1", price=1))
    service.create_product(ProductCreate(name="B", sku="B-1", price=1))
    service.create_product(ProductCreate(name="C", sku="C-1", price=1))
    
    products = service.list_products(skip=0, limit=2)
    assert len(products) == 2


def test_list_low_stock_products(db_session):
    service = ProductService(db_session)
    service.create_product(ProductCreate(name="Normal", sku="NS-1", price=10, quantity_in_stock=20))
    service.create_product(ProductCreate(name="Low", sku="LS-1", price=10, quantity_in_stock=5))
    service.create_product(ProductCreate(name="Zero", sku="ZS-1", price=10, quantity_in_stock=0))
    
    # Default threshold is 10 (inclusive)
    low_stock = service.list_products(skip=0, limit=100, low_stock=True, threshold=10)
    assert len(low_stock) == 2
    skus = [p.sku for p in low_stock]
    assert "LS-1" in skus
    assert "ZS-1" in skus
    assert "NS-1" not in skus


def test_update_product(db_session):
    service = ProductService(db_session)
    created = service.create_product(ProductCreate(name="Old", sku="UPD-1", price=10))
    
    update_dto = ProductUpdate(name="New", price=15.0)
    updated = service.update_product(created.id, update_dto)
    
    assert updated.name == "New"
    assert updated.price == 15.0
    assert updated.sku == "UPD-1"  # Unchanged


def test_update_product_duplicate_sku(db_session):
    service = ProductService(db_session)
    service.create_product(ProductCreate(name="Prod A", sku="SKU-A", price=10))
    prod_b = service.create_product(ProductCreate(name="Prod B", sku="SKU-B", price=10))
    
    update_dto = ProductUpdate(sku="SKU-A")
    with pytest.raises(ConflictException):
        service.update_product(prod_b.id, update_dto)


def test_delete_product(db_session):
    service = ProductService(db_session)
    created = service.create_product(ProductCreate(name="Delete Me", sku="DEL-1", price=10))
    
    service.delete_product(created.id)
    
    with pytest.raises(NotFoundException):
        service.get_product(created.id)
