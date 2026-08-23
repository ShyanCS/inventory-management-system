"""
FastAPI application factory.

Creates the app, registers routers, configures CORS, and sets up
global exception handlers for the consistent error envelope.
"""

import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging_config import configure_logging, logger
from app.routers import customers, dashboard, orders, products


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    configure_logging(settings.log_level)

    application = FastAPI(
        title="Inventory & Order Management System",
        description="REST API for managing products, customers, and orders.",
        version="1.0.0",
    )

    # --- Request logging ---
    @application.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.info(
            "Request completed",
            extra={
                "http_method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response

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
        logger.error(
            "Unhandled exception on %s %s",
            request.method,
            request.url.path,
            exc_info=True,
        )
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
