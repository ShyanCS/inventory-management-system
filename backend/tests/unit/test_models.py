"""
Phase 1 — Data model constraint tests.

TDD Red: These tests are written BEFORE the SQLAlchemy models exist.
They assert database-level constraints:
  1. Duplicate SKU raises IntegrityError
  2. Duplicate email raises IntegrityError
  3. Negative stock is rejected at the DB level
  4. Product price must be > 0
  5. Order item quantity must be > 0
  6. Tables are created correctly from models
"""
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem


class TestProductConstraints:
    """Test database constraints on the products table."""

    def test_create_product_valid(self, db_session):
        """A valid product can be created successfully."""
        product = Product(
            name="Wireless Mouse",
            sku="WM-1001",
            price=19.99,
            quantity_in_stock=100,
        )
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)

        assert product.id is not None
        assert product.name == "Wireless Mouse"
        assert product.sku == "WM-1001"
        assert float(product.price) == 19.99
        assert product.quantity_in_stock == 100
        assert product.created_at is not None
        assert product.updated_at is not None

    def test_duplicate_sku_raises_integrity_error(self, db_session):
        """A duplicate SKU should raise an IntegrityError."""
        product1 = Product(name="Mouse A", sku="WM-1001", price=19.99, quantity_in_stock=10)
        db_session.add(product1)
        db_session.commit()

        product2 = Product(name="Mouse B", sku="WM-1001", price=29.99, quantity_in_stock=5)
        db_session.add(product2)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_negative_stock_rejected(self, db_session):
        """Negative quantity_in_stock should be rejected by the DB check constraint."""
        product = Product(name="Widget", sku="WG-001", price=9.99, quantity_in_stock=-1)
        db_session.add(product)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_zero_price_rejected(self, db_session):
        """Price of 0 should be rejected (must be > 0)."""
        product = Product(name="Free Item", sku="FR-001", price=0, quantity_in_stock=10)
        db_session.add(product)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_null_name_rejected(self, db_session):
        """Product name cannot be null."""
        product = Product(name=None, sku="NN-001", price=10.00, quantity_in_stock=5)
        db_session.add(product)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_null_sku_rejected(self, db_session):
        """Product SKU cannot be null."""
        product = Product(name="No SKU", sku=None, price=10.00, quantity_in_stock=5)
        db_session.add(product)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_default_stock_is_zero(self, db_session):
        """If quantity_in_stock is not provided, it should default to 0."""
        product = Product(name="Default Stock", sku="DS-001", price=5.00)
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)
        assert product.quantity_in_stock == 0


class TestCustomerConstraints:
    """Test database constraints on the customers table."""

    def test_create_customer_valid(self, db_session):
        """A valid customer can be created successfully."""
        customer = Customer(
            full_name="Asha Verma",
            email="asha@example.com",
            phone="+91-9876543210",
        )
        db_session.add(customer)
        db_session.commit()
        db_session.refresh(customer)

        assert customer.id is not None
        assert customer.full_name == "Asha Verma"
        assert customer.email == "asha@example.com"
        assert customer.phone == "+91-9876543210"
        assert customer.created_at is not None

    def test_duplicate_email_raises_integrity_error(self, db_session):
        """A duplicate email should raise an IntegrityError."""
        c1 = Customer(full_name="User A", email="dup@example.com", phone="111")
        db_session.add(c1)
        db_session.commit()

        c2 = Customer(full_name="User B", email="dup@example.com", phone="222")
        db_session.add(c2)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_null_name_rejected(self, db_session):
        """Customer full_name cannot be null."""
        customer = Customer(full_name=None, email="nn@test.com", phone="123")
        db_session.add(customer)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_null_email_rejected(self, db_session):
        """Customer email cannot be null."""
        customer = Customer(full_name="No Email", email=None, phone="123")
        db_session.add(customer)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_null_phone_rejected(self, db_session):
        """Customer phone cannot be null."""
        customer = Customer(full_name="No Phone", email="np@test.com", phone=None)
        db_session.add(customer)
        with pytest.raises(IntegrityError):
            db_session.commit()


class TestOrderConstraints:
    """Test database constraints on the orders and order_items tables."""

    def _create_customer(self, db_session):
        """Helper to create a test customer."""
        customer = Customer(full_name="Test User", email="test@order.com", phone="555")
        db_session.add(customer)
        db_session.commit()
        db_session.refresh(customer)
        return customer

    def _create_product(self, db_session, sku="TP-001"):
        """Helper to create a test product."""
        product = Product(name="Test Product", sku=sku, price=25.00, quantity_in_stock=50)
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)
        return product

    def test_create_order_valid(self, db_session):
        """A valid order with items can be created."""
        customer = self._create_customer(db_session)
        product = self._create_product(db_session)

        order = Order(
            customer_id=customer.id,
            status="pending",
            total_amount=50.00,
        )
        db_session.add(order)
        db_session.commit()
        db_session.refresh(order)

        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=2,
            unit_price=25.00,
            subtotal=50.00,
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(item)

        assert order.id is not None
        assert order.customer_id == customer.id
        assert order.status == "pending"
        assert item.order_id == order.id
        assert item.quantity == 2

    def test_order_item_quantity_must_be_positive(self, db_session):
        """Order item quantity must be > 0."""
        customer = self._create_customer(db_session)
        product = self._create_product(db_session, sku="QT-001")

        order = Order(customer_id=customer.id, status="pending", total_amount=0)
        db_session.add(order)
        db_session.commit()

        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=0,
            unit_price=25.00,
            subtotal=0,
        )
        db_session.add(item)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_order_requires_customer(self, db_session):
        """An order must have a valid customer_id (NOT NULL)."""
        order = Order(customer_id=None, status="pending", total_amount=0)
        db_session.add(order)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_order_items_cascade_delete(self, db_session):
        """Deleting an order should cascade-delete its order items."""
        customer = self._create_customer(db_session)
        product = self._create_product(db_session, sku="CD-001")

        order = Order(customer_id=customer.id, status="pending", total_amount=25.00)
        db_session.add(order)
        db_session.commit()

        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            unit_price=25.00,
            subtotal=25.00,
        )
        db_session.add(item)
        db_session.commit()
        item_id = item.id

        # Delete the order
        db_session.delete(order)
        db_session.commit()

        # The order item should be gone (cascade delete)
        deleted_item = db_session.get(OrderItem, item_id)
        assert deleted_item is None
