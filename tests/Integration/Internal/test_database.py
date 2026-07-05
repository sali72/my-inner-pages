import pytest
from motor.motor_asyncio import AsyncIOMotorClient


COLLECTIONS = {
    "users": {
        "expected_indexes": {
            "_id_",
            "email_1",
            "created_at_1",
        },
    },
    "journals": {
        "expected_indexes": {
            "_id_",
            "user_id_1",
            "created_at_1",
            "tags_1",
            "user_id_1_created_at_-1",
            "user_id_1_tags_1",
        },
    },
    "chats": {
        "expected_indexes": {
            "_id_",
            "user_id_1",
            "user_id_1_created_at_-1",
        },
    },
    "user_models": {
        "expected_indexes": {
            "_id_",
            "user_id_1",
        },
    },
}


@pytest.mark.asyncio
async def test_mongodb_reachable(mongo_client: AsyncIOMotorClient):
    result = await mongo_client.admin.command("ping")
    assert result.get("ok") == 1.0, "MongoDB ping failed"


@pytest.mark.asyncio
async def test_can_create_and_drop_test_database(mongo_client: AsyncIOMotorClient):
    db = mongo_client["journaling_app_integration_test"]
    collection = db["probe"]
    await collection.insert_one({"_id": "probe", "value": 1})
    doc = await collection.find_one({"_id": "probe"})
    assert doc is not None
    assert doc["value"] == 1
    await db.drop_collection("probe")


@pytest.mark.asyncio
async def test_required_collections_exist(mongo_client: AsyncIOMotorClient):
    db = mongo_client["journaling_app"]
    existing = await db.list_collection_names()
    for coll_name in COLLECTIONS:
        assert coll_name in existing, (
            f"Required collection '{coll_name}' not found. "
            f"Run the app to let Beanie create it."
        )


@pytest.mark.asyncio
async def test_required_indexes_exist(mongo_client: AsyncIOMotorClient):
    db = mongo_client["journaling_app"]
    for coll_name, spec in COLLECTIONS.items():
        indexes = await db[coll_name].index_information()
        actual = set(indexes.keys())
        expected = spec["expected_indexes"]
        missing = expected - actual
        assert not missing, (
            f"Collection '{coll_name}' missing indexes: {missing}. "
            f"Found: {actual}"
        )
