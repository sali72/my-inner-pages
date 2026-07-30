"""
E2E tests for deleting chats.

Tests the happy path for the DELETE /api/v0/chats/{chat_id} endpoint.
"""

import pytest
from httpx import AsyncClient

from app.chat.db.models import Chat, ChatMessage
from tests.config import CHAT_PREFIX


@pytest.mark.asyncio
async def test_delete_chat(authenticated_client: AsyncClient, test_user: dict):
    """
    Test deleting a chat.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    chat = Chat(
        user_id=user_id,
        title="Chat to Delete",
        messages=[ChatMessage(role="user", content="Will be deleted")],
    )
    await chat.insert()
    chat_id = str(chat.id)

    db_chat_before = await Chat.get(chat_id)
    assert db_chat_before is not None

    response = await authenticated_client.delete(f"{CHAT_PREFIX}/{chat_id}")

    assert response.status_code == 200
    response_data = response.json()
    assert "deleted successfully" in response_data["message"].lower()

    db_chat_after = await Chat.get(chat_id)
    assert db_chat_after is None


@pytest.mark.asyncio
async def test_delete_chat_not_found(authenticated_client: AsyncClient):
    """
    Test deleting a non-existent chat returns 404.

    Args:
        authenticated_client: HTTP client with authentication headers
    """
    fake_id = "507f1f77bcf86cd799439011"
    response = await authenticated_client.delete(f"{CHAT_PREFIX}/{fake_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_chat_removes_only_target(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that deleting one chat doesn't affect other chats.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    chat1 = Chat(
        user_id=user_id,
        title="Chat One",
        messages=[ChatMessage(role="user", content="First")],
    )
    chat2 = Chat(
        user_id=user_id,
        title="Chat Two",
        messages=[ChatMessage(role="user", content="Second")],
    )
    await chat1.insert()
    await chat2.insert()
    chat1_id = str(chat1.id)
    chat2_id = str(chat2.id)

    delete_response = await authenticated_client.delete(f"{CHAT_PREFIX}/{chat1_id}")

    assert delete_response.status_code == 200

    db_chat1 = await Chat.get(chat1_id)
    assert db_chat1 is None

    db_chat2 = await Chat.get(chat2_id)
    assert db_chat2 is not None
    assert db_chat2.title == "Chat Two"


@pytest.mark.asyncio
async def test_delete_chat_other_user(authenticated_client: AsyncClient, another_test_user: dict):
    """
    Test that a user cannot delete another user's chat.

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

    response = await authenticated_client.delete(f"{CHAT_PREFIX}/{other_chat_id}")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
