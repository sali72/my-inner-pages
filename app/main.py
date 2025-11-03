from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings
from app.core.db import DatabaseManager
from app.core.deps.database import set_db_manager
from app.core.logging import configure_logging, get_logger
from app.journals.db.models import Journal
from app.auth.db.models import User
from app.journals.api.v0.routes import journals as journals_router
from app.auth.api.v0.routes import auth as auth_router
from app.ai.api.v0.routes import mirror as mirror_router

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
    settings = Settings()
    logger.info("application_startup", environment=settings.environment, database=settings.database_name)
    
    db_manager = DatabaseManager(settings)
    
    # Initialize Beanie with all document models
    await db_manager.connect(document_models=[Journal, User])
    
    # Set global database manager
    set_db_manager(db_manager)
    
    logger.info("database_connected", database=settings.database_name)
    print(f"✓ Connected to MongoDB: {settings.database_name}")
    print(f"✓ Application started in {settings.environment} mode")
    
    yield
    
    # Shutdown
    await db_manager.disconnect()
    logger.info("application_shutdown")
    print("✓ Disconnected from MongoDB")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = Settings()
    
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-boosted Journaling API with focus on self-knowledge",
        lifespan=lifespan
    )
    
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
    
    @app.get("/", tags=["health"])
    async def root():
        """Root endpoint - health check."""
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment
        }
    
    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok"}
    
    return app


app = create_app()
