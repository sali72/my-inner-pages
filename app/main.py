from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.api.v0.routes import mirror as mirror_router
from app.auth.api.v0.routes import auth as auth_router
from app.ai.api.v0.routes import chat as chat_router
from app.core.deps.database import get_client
from app.core.deps.settings import get_settings
from app.core.logging import configure_logging, get_logger
from app.journals.api.v0.routes import journals as journals_router

# Configure logging
configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    settings = get_settings()
    logger.info(
        "application_startup",
        environment=settings.environment,
        database=settings.database_name,
    )

    # Initialize MongoDB client and Beanie (cached)
    client = await get_client()

    logger.info("database_connected", database=settings.database_name)
    print(f"✓ Connected to MongoDB: {settings.database_name}")
    print(f"✓ Application started in {settings.environment} mode")

    yield

    # Shutdown
    client.close()
    logger.info("application_shutdown")
    print("✓ Disconnected from MongoDB")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    from app.core.middleware import RequestLoggingMiddleware
    
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-boosted Journaling API with focus on self-knowledge",
        lifespan=lifespan,
    )

    # Request logging middleware
    app.add_middleware(RequestLoggingMiddleware)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Simplified for easy deployment
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(auth_router.router, prefix="/api/v0")
    app.include_router(journals_router.router, prefix="/api/v0")
    app.include_router(mirror_router.router, prefix="/api/v0")
    app.include_router(chat_router.router, prefix="/api/v0")

    @app.get("/", tags=["health"])
    async def root():
        """Root endpoint - health check."""
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        }

    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint with database connectivity check."""
        try:
            # Check database connection
            client = await get_client()
            await client.admin.command('ping')
            
            return {
                "status": "healthy",
                "database": "connected",
                "app": settings.app_name,
                "version": settings.app_version
            }
        except Exception as e:
            logger.error("health_check_failed", error=str(e))
            return {
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e)
            }

    return app


app = create_app()
