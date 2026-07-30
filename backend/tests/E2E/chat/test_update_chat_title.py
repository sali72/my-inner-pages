"""
E2E tests for updating chat titles.

Tests the happy path for the PATCH /api/v0/chats/{chat_id}/title endpoint.
"""

import pytest
from httpx import AsyncClient

from app.chat.db.models import Chat, ChatMessage
from tests.config import CHAT_PREFIX


@pytest.mark.asyncio
async def test_update_chat_title(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating a chat title.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    chat = Chat(
        user_id=user_id,
        title="Original Title",
        messages=[ChatMessage(role="user", content="Hello")],
    )
    await chat.insert()
    chat_id = str(chat.id)

    new_title = "Updated Title"
    response = await authenticated_client.patch(
        f"{CHAT_PREFIX}/{chat_id}/title",
        json={"title": new_title},
    )

    assert response.status_code == 200
    response_data = response.json()

    assert response_data["id"] == chat_id
    assert response_data["title"] == new_title
    assert response_data["message_count"] == 1

    db_chat = await Chat.get(chat_id)
    assert db_chat.title == new_title
    assert db_chat.user_id == test_user["user_id"]


@pytest.mark.asyncio
async def test_update_chat_title_not_found(authenticated_client: AsyncClient):
    """
    Test updating a non-existent chat returns 404.

    Args:
        authenticated_client: HTTP client with authentication headers
    """
    fake_id = "507f1f77bcf86cd799439011"
    response = await authenticated_client.patch(
        f"{CHAT_PREFIX}/{fake_id}/title",
        json={"title": "New Title"},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_chat_title_other_user(authenticated_client: AsyncClient, another_test_user: dict):
    """
    Test that a user cannot update another user's chat title.

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

    response = await authenticated_client.patch(
        f"{CHAT_PREFIX}/{other_chat_id}/title",
        json={"title": "Hacked Title"},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_chat_title_persists_messages(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that updating the title doesn't alter messages.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    chat = Chat(
        user_id=user_id,
        title="Original",
        messages=[
            ChatMessage(role="user", content="First message"),
            ChatMessage(role="assistant", content="Response"),
        ],
    )
    await chat.insert()
    chat_id = str(chat.id)

    await authenticated_client.patch(
        f"{CHAT_PREFIX}/{chat_id}/title",
        json={"title": "New Title"},
    )

    db_chat = await Chat.get(chat_id)
    assert len(db_chat.messages) == 2
    assert db_chat.messages[0].content == "First message"
    assert db_chat.messages[1].content == "Response"
