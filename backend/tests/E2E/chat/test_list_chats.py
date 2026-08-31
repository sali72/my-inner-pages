"""
E2E tests for listing chats.

Tests the happy path for the GET /api/v0/chats endpoint.
"""

import pytest
from httpx import AsyncClient
from datetime import datetime

from app.chat.db.models import Chat, ChatMessage
from tests.config import CHAT_PREFIX


@pytest.mark.asyncio
async def test_list_chats_empty(authenticated_client: AsyncClient, test_user: dict):
    """
    Test listing chats when user has no chats.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    response = await authenticated_client.get(CHAT_PREFIX)

    assert response.status_code == 200
    response_data = response.json()

    assert response_data["total"] == 0
    assert response_data["items"] == []
    assert response_data["page"] == 1
    assert response_data["page_size"] == 50
    assert response_data["total_pages"] == 0


@pytest.mark.asyncio
async def test_list_chats_with_data(authenticated_client: AsyncClient, test_user: dict):
    """
    Test listing chats when user has multiple chats.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    chats_data = [
        {"title": "Chat One", "message_count": 2},
        {"title": "Chat Two", "message_count": 4},
        {"title": "Chat Three", "message_count": 1},
    ]

    for cd in chats_data:
        chat = Chat(
            user_id=user_id,
            title=cd["title"],
            messages=[ChatMessage(role="user", content="Hello") for _ in range(cd["message_count"])],
        )
        await chat.insert()

    response = await authenticated_client.get(CHAT_PREFIX)

    assert response.status_code == 200
    response_data = response.json()

    assert response_data["total"] == 3
    assert len(response_data["items"]) == 3
    assert response_data["page"] == 1
    assert response_data["page_size"] == 50
    assert response_data["total_pages"] == 1

    titles = [item["title"] for item in response_data["items"]]
    assert "Chat One" in titles
    assert "Chat Two" in titles
    assert "Chat Three" in titles

    for item in response_data["items"]:
        assert "id" in item
        assert "title" in item
        assert "message_count" in item
        assert "created_at" in item
        assert "updated_at" in item


@pytest.mark.asyncio
async def test_list_chats_pagination(authenticated_client: AsyncClient, test_user: dict):
    """
    Test pagination when listing chats.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    user_id = test_user["user_id"]

    for i in range(5):
        chat = Chat(
            user_id=user_id,
            title=f"Chat {i + 1}",
            messages=[ChatMessage(role="user", content=f"Message {i + 1}")],
        )
        await chat.insert()

    response = await authenticated_client.get(f"{CHAT_PREFIX}?page=1&page_size=2")

    assert response.status_code == 200
    response_data = response.json()

    assert response_data["total"] == 5
    assert len(response_data["items"]) == 2
    assert response_data["page"] == 1
    assert response_data["page_size"] == 2
    assert response_data["total_pages"] == 3

    response_page2 = await authenticated_client.get(f"{CHAT_PREFIX}?page=2&page_size=2")

    assert response_page2.status_code == 200
    response_data_page2 = response_page2.json()

    assert response_data_page2["total"] == 5
    assert len(response_data_page2["items"]) == 2
    assert response_data_page2["page"] == 2


@pytest.mark.asyncio
async def test_list_chats_with_overlong_title(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that legacy/raw documents in MongoDB with titles exceeding 100 characters
    are truncated gracefully rather than skipped with validation errors.
    """
    user_id = test_user["user_id"]

    long_title = "I just received this emotional reflection on my journaling and I'd like to explore it with you: " + "a" * 100
    chat = Chat(
        user_id=user_id,
        title=long_title,
        messages=[ChatMessage(role="user", content="Hello")],
    )
    await chat.insert()

    response = await authenticated_client.get(CHAT_PREFIX)
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["total"] == 1
    assert len(response_data["items"]) == 1
    assert len(response_data["items"][0]["title"]) <= 100
    assert response_data["items"][0]["title"].endswith("...")

