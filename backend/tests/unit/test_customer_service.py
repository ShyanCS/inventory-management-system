"""
Unit tests for the Customer Service.
TDD Red Phase: Written before the service is implemented.
"""
import pytest

from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerCreate
from app.core.exceptions import ConflictException, NotFoundException


def test_create_customer(db_session):
    service = CustomerService(db_session)
    create_dto = CustomerCreate(
        full_name="Alice Smith",
        email="alice@example.com",
        phone="+1-555-0100"
    )
    customer = service.create_customer(create_dto)
    
    assert customer.id is not None
    assert customer.full_name == "Alice Smith"
    assert customer.email == "alice@example.com"
    assert customer.phone == "+1-555-0100"


def test_create_customer_duplicate_email(db_session):
    service = CustomerService(db_session)
    create_dto = CustomerCreate(
        full_name="Bob Jones",
        email="bob@example.com",
        phone="555-0101"
    )
    service.create_customer(create_dto)
    
    with pytest.raises(ConflictException) as exc:
        service.create_customer(create_dto)
    
    assert "email" in str(exc.value).lower()


def test_get_customer(db_session):
    service = CustomerService(db_session)
    create_dto = CustomerCreate(full_name="C", email="c@test.com", phone="1")
    created = service.create_customer(create_dto)
    
    fetched = service.get_customer(created.id)
    assert fetched.id == created.id
    assert fetched.email == "c@test.com"


def test_get_customer_not_found(db_session):
    service = CustomerService(db_session)
    with pytest.raises(NotFoundException):
        service.get_customer(99999)


def test_list_customers(db_session):
    service = CustomerService(db_session)
    service.create_customer(CustomerCreate(full_name="L1", email="l1@test.com", phone="1"))
    service.create_customer(CustomerCreate(full_name="L2", email="l2@test.com", phone="2"))
    
    customers = service.list_customers(skip=0, limit=2)
    assert len(customers) == 2


def test_delete_customer(db_session):
    service = CustomerService(db_session)
    created = service.create_customer(CustomerCreate(full_name="Del", email="del@test.com", phone="1"))
    
    service.delete_customer(created.id)
    
    with pytest.raises(NotFoundException):
        service.get_customer(created.id)

def test_delete_customer_with_orders(db_session):
    from app.services.order_service import OrderService
    from app.services.product_service import ProductService
    from app.schemas.order import OrderCreate, OrderItemCreate
    from app.schemas.product import ProductCreate

    c_service = CustomerService(db_session)
    p_service = ProductService(db_session)
    o_service = OrderService(db_session)

    customer = c_service.create_customer(CustomerCreate(full_name="Del", email="del2@test.com", phone="1"))
    product = p_service.create_product(ProductCreate(name="P", sku="SKU-DEL", price=10, quantity_in_stock=5))
    
    o_service.create_order(OrderCreate(
        customer_id=customer.id,
        items=[OrderItemCreate(product_id=product.id, quantity=1)]
    ))

    with pytest.raises(ConflictException) as exc:
        c_service.delete_customer(customer.id)
    
    assert "orders" in str(exc.value).lower()
