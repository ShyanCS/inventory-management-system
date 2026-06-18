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

    # --- Health endpoint ---
    @application.get("/health")
    def health_check():
        return {"status": "healthy"}

    return application


app = create_app()
