from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import Settings


class DatabaseManager:
    """Manages MongoDB connection and Beanie initialization."""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client: Optional[AsyncIOMotorClient] = None
    
    async def connect(self, document_models: list) -> None:
        """
        Establish database connection and initialize Beanie ODM.
        
        Args:
            document_models: List of Beanie document model classes to initialize
        """
        self.client = AsyncIOMotorClient(self.settings.mongo_url)
        database = self.client[self.settings.database_name]
        
        await init_beanie(
            database=database,
            document_models=document_models
        )
    
    async def disconnect(self) -> None:
        """Close database connection."""
        if self.client:
            self.client.close()
            self.client = None
    
    def get_client(self) -> AsyncIOMotorClient:
        """Get the MongoDB client instance."""
        if not self.client:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self.client
