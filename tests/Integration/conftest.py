import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient


MONGO_URL = "mongodb://localhost:27017"


@pytest_asyncio.fixture
async def mongo_client() -> AsyncIOMotorClient:
    client = AsyncIOMotorClient(MONGO_URL)
    yield client
    client.close()
