"""
E2E tests for user preferences.

Tests the happy path for the GET /api/v0/auth/me and PUT /api/v0/auth/me/preferences endpoints.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from tests.config import AUTH_PREFIX


DEFAULT_PREFERENCES = {
    "mode": "system",
    "accent": "amber",
    "fontStyle": "serif",
    "fontSize": "medium",
}


@pytest.mark.asyncio
async def test_get_preferences_defaults(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that a newly registered user has default preferences.

    This test verifies that default preferences are set on registration
    and returned in the GET /auth/me response.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Get current user info
    response = await authenticated_client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")

    # Assert: Verify response includes preferences with defaults
    assert response.status_code == 200
    response_data = response.json()

    assert "preferences" in response_data
    assert response_data["preferences"] == DEFAULT_PREFERENCES


@pytest.mark.asyncio
async def test_get_preferences_in_get_me(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that preferences are consistently returned in GET /auth/me.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Get user info twice
    response1 = await authenticated_client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")
    response2 = await authenticated_client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")

    # Assert: Both responses include preferences
    assert response1.status_code == 200
    assert response2.status_code == 200
    assert response1.json()["preferences"] == response2.json()["preferences"]


@pytest.mark.asyncio
async def test_update_preferences_full(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating all preference fields at once.

    This test verifies that a full preference update is persisted
    in the response and the database.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: New preferences
    new_preferences = {
        "mode": "dark",
        "accent": "dusk",
        "fontStyle": "sans",
        "fontSize": "large",
    }

    # Act: Update all preferences
    response = await authenticated_client.put(
        f"{AUTH_PREFIX}{AuthRoutes.PREFERENCES}",
        json=new_preferences
    )

    # Assert: Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    response_data = response.json()

    assert "preferences" in response_data
    assert response_data["preferences"] == new_preferences

    # Verify changes persisted in database
    db_user = await User.find_one(User.email == test_user["email"])
    assert db_user is not None
    assert db_user.preferences.mode == new_preferences["mode"]
    assert db_user.preferences.accent == new_preferences["accent"]
    assert db_user.preferences.fontStyle == new_preferences["fontStyle"]
    assert db_user.preferences.fontSize == new_preferences["fontSize"]


@pytest.mark.asyncio
async def test_update_preferences_partial(authenticated_client: AsyncClient, test_user: dict):
    """
    Test updating only a subset of preference fields.

    This test verifies that a partial update only changes the specified fields
    while leaving other fields at their default values.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Update only the mode
    partial = {"mode": "dark"}

    response = await authenticated_client.put(
        f"{AUTH_PREFIX}{AuthRoutes.PREFERENCES}",
        json=partial
    )

    # Assert: Verify only mode changed, others remain default
    assert response.status_code == 200
    response_data = response.json()

    assert response_data["preferences"]["mode"] == "dark"
    assert response_data["preferences"]["accent"] == DEFAULT_PREFERENCES["accent"]
    assert response_data["preferences"]["fontStyle"] == DEFAULT_PREFERENCES["fontStyle"]
    assert response_data["preferences"]["fontSize"] == DEFAULT_PREFERENCES["fontSize"]

    # Verify in database
    db_user = await User.find_one(User.email == test_user["email"])
    assert db_user is not None
    assert db_user.preferences.mode == "dark"
    assert db_user.preferences.accent == DEFAULT_PREFERENCES["accent"]
    assert db_user.preferences.fontStyle == DEFAULT_PREFERENCES["fontStyle"]
    assert db_user.preferences.fontSize == DEFAULT_PREFERENCES["fontSize"]


@pytest.mark.asyncio
async def test_update_preferences_empty(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that sending an empty update leaves preferences unchanged.

    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Send empty update
    response = await authenticated_client.put(
        f"{AUTH_PREFIX}{AuthRoutes.PREFERENCES}",
        json={}
    )

    # Assert: Preferences should remain at defaults
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["preferences"] == DEFAULT_PREFERENCES


@pytest.mark.asyncio
async def test_update_preferences_without_auth(client: AsyncClient):
    """
    Test that updating preferences without authentication returns 403.

    Args:
        client: HTTP client without authentication
    """
    # Act: Try to update preferences without auth
    response = await client.put(
        f"{AUTH_PREFIX}{AuthRoutes.PREFERENCES}",
        json={"mode": "dark"}
    )

    # Assert: Verify 401 response
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_preferences_survive_login_logout(authenticated_client: AsyncClient, client: AsyncClient, test_user: dict):
    """
    Test that preferences persist across authentication sessions.

    This test verifies that preferences are stored server-side and survive
    the client tearing down and re-creating its auth context.

    Args:
        authenticated_client: HTTP client with authentication headers
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Update preferences
    await authenticated_client.put(
        f"{AUTH_PREFIX}{AuthRoutes.PREFERENCES}",
        json={"accent": "moss"}
    )

    # Act: Login fresh to get a new client session
    login_response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.LOGIN}",
        json={"email": test_user["email"], "password": test_user["password"]}
    )
    assert login_response.status_code == 200
    new_token = login_response.json()["access_token"]

    fresh_client = client
    fresh_client.cookies.set("access_token", new_token)
    response = await fresh_client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")

    # Assert: Preferences from previous update are still there
    assert response.status_code == 200
    assert response.json()["preferences"]["accent"] == "moss"
