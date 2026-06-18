"""
Custom exception classes and global exception handlers.

These map domain exceptions to the consistent error envelope
defined in PROJECT_SPECIFICATION.md section 5.6.
"""


class AppException(Exception):
    """Base exception for all application-level errors."""

    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class NotFoundException(AppException):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str = "Resource not found", details: dict | None = None):
        super().__init__(code="NOT_FOUND", message=message, status_code=404, details=details)


class ConflictException(AppException):
    """Raised on duplicate SKU/email, insufficient stock, or deleting referenced entities."""

    def __init__(self, code: str = "CONFLICT", message: str = "Conflict", details: dict | None = None):
        super().__init__(code=code, message=message, status_code=409, details=details)
