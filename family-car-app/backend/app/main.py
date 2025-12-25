"""
Main FastAPI application.
Configures the application, middleware, and routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import auth, reservations, fuel_logs, rules, users, websocket
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    description="API for managing a shared family car",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(reservations.router)
app.include_router(fuel_logs.router)
app.include_router(rules.router)
app.include_router(users.router)
app.include_router(websocket.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Family Car Manager API",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Startup event handler."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.API_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler."""
    logger.info("Shutting down application")
