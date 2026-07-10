import asyncio
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.api.v0.routes import mirror as mirror_router
from app.ai.api.v0.routes import llm_admin as llm_admin_router
from app.auth.api.v0.routes import auth as auth_router
from app.ai.api.v0.routes import chat as chat_router
from app.chat.api.v0.routes import chat_rest as chat_rest_router
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

    # Retry connecting to MongoDB with exponential backoff
    max_retries = 10
    base_delay = 2
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            client = await get_client()
            last_exception = None
            break
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                delay = base_delay * (2 ** (attempt - 1))
                logger.warning(
                    "database_connection_retry",
                    attempt=attempt,
                    max_retries=max_retries,
                    delay=delay,
                    error=str(e),
                )
                print(f"⏳ Waiting for MongoDB (attempt {attempt}/{max_retries}, retrying in {delay}s)...")
                await asyncio.sleep(delay)
    if last_exception:
        logger.error("database_connection_failed", error=str(last_exception))
        print(f"✗ Failed to connect to MongoDB after {max_retries} attempts")
        raise last_exception

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
    app.include_router(llm_admin_router.router, prefix="/api/v0")
    app.include_router(chat_router.router, prefix="/api/v0")
    app.include_router(chat_rest_router.router, prefix="/api/v0")

    # Dev-only memory management routes
    if not settings.is_production:
        from app.memory.api.v0.routes import user_model as user_model_router
        app.include_router(user_model_router.router, prefix="/api/v0")
        logger.info("memory_dev_routes_enabled")

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
