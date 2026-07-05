"""
E2E tests for getting a specific chat.

Tests the happy path for the GET /api/v0/chats/{chat_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.chat.db.models import Chat, ChatMessage
from tests.config import CHAT_PREFIX


@pytest.mark.asyncio
async def test_get_chat_by_id(authenticated_client: AsyncClient, test_user: dict):
    """
    Test retrieving a specific chat by ID.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    chat = Chat(
        user_id=user_id,
        title="Test Chat",
        messages=[
            ChatMessage(role="user", content="Hello"),
            ChatMessage(role="assistant", content="Hi there!"),
        ],
    )
    await chat.insert()
    chat_id = str(chat.id)

    response = await authenticated_client.get(f"{CHAT_PREFIX}/{chat_id}")

    assert response.status_code == 200
    response_data = response.json()

    assert response_data["id"] == chat_id
    assert response_data["title"] == "Test Chat"
    assert response_data["message_count"] == 2
    assert len(response_data["messages"]) == 2
    assert response_data["messages"][0]["role"] == "user"
    assert response_data["messages"][0]["content"] == "Hello"
    assert response_data["messages"][1]["role"] == "assistant"
    assert response_data["messages"][1]["content"] == "Hi there!"
    assert "created_at" in response_data
    assert "updated_at" in response_data
    assert response_data["linked_entry_id"] is None


@pytest.mark.asyncio
async def test_get_chat_not_found(authenticated_client: AsyncClient):
    """
    Test retrieving a non-existent chat returns 404.

    Args:
        authenticated_client: HTTP client with authentication headers
    """
    fake_id = "507f1f77bcf86cd799439011"
    response = await authenticated_client.get(f"{CHAT_PREFIX}/{fake_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_chat_other_user(authenticated_client: AsyncClient, another_test_user: dict):
    """
    Test that a user cannot access another user's chat.

    Args:
        authenticated_client: HTTP client for first user
        another_test_user: Second test user with credentials
    """
    other_chat = Chat(
        user_id=another_test_user["user_id"],
        title="Other User's Chat",
        messages=[ChatMessage(role="user", content="Secret")],
    )
    await other_chat.insert()
    other_chat_id = str(other_chat.id)

    response = await authenticated_client.get(f"{CHAT_PREFIX}/{other_chat_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
