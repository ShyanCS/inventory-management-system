"""
FastAPI application factory.

Creates the app, registers routers, configures CORS, and sets up
global exception handlers for the consistent error envelope.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.routers import products, customers, orders, dashboard


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title="Inventory & Order Management System",
        description="REST API for managing products, customers, and orders.",
        version="1.0.0",
    )

    # --- CORS ---
    origins = [origin.strip() for origin in settings.backend_cors_origins.split(",")]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Global exception handlers ---
    @application.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    from fastapi.exceptions import RequestValidationError
    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "The request payload is invalid.",
                    "details": exc.errors(),
                }
            },
        )

    @application.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        import logging
        logging.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred.",
                    "details": None,
                }
            },
        )

    # --- Routers ---
    application.include_router(products.router)
    application.include_router(customers.router)
    application.include_router(orders.router)
    application.include_router(dashboard.router)

    # --- Health endpoint ---
    @application.get("/health")
    def health_check():
        return {"status": "healthy"}

    return application


app = create_app()
