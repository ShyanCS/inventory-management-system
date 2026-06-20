"""
Service layer for Product business logic.
"""
from typing import List

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import ConflictException, NotFoundException
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = ProductRepository(session)

    def _check_sku_exists(self, sku: str) -> None:
        if self.repo.get_by_sku(sku):
            raise ConflictException(
                message=f"Product with SKU '{sku}' already exists",
                details={"sku": sku}
            )

    def create_product(self, product_in: ProductCreate) -> Product:
        self._check_sku_exists(product_in.sku)
        try:
            return self.repo.create(product_in)
        except IntegrityError as e:
            self.session.rollback()
            # Fallback if constraint was caught at DB level instead of service level
            if "sku" in str(e).lower() or "unique" in str(e).lower():
                raise ConflictException(message="Product SKU already exists", details={"sku": product_in.sku})
            raise e

    def get_product(self, product_id: int) -> Product:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise NotFoundException(message=f"Product with ID {product_id} not found")
        return product

    def list_products(self, skip: int = 0, limit: int = 50, low_stock: bool = False, threshold: int = 10) -> List[Product]:
        return self.repo.list(skip=skip, limit=limit, low_stock=low_stock, threshold=threshold)

    def update_product(self, product_id: int, product_in: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        
        if product_in.sku and product_in.sku != product.sku:
            self._check_sku_exists(product_in.sku)
            
        try:
            return self.repo.update(product, product_in)
        except IntegrityError as e:
            self.session.rollback()
            if "sku" in str(e).lower() or "unique" in str(e).lower():
                raise ConflictException(message="Product SKU already exists", details={"sku": product_in.sku})
            raise e

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        try:
            self.repo.delete(product)
        except IntegrityError as e:
            self.session.rollback()
            # e.g., if referenced by an order item
            raise ConflictException(
                message="Cannot delete product because it is referenced by existing orders."
            )
