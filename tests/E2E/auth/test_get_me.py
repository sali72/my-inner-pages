"""
E2E tests for getting current user information.

Tests the GET /api/v0/auth/me endpoint.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from tests.config import AUTH_PREFIX


@pytest.mark.asyncio
async def test_get_current_user(authenticated_client: AsyncClient, test_user: dict):
    """
    Test retrieving current user information.
    
    This test verifies that an authenticated user can retrieve
    their own user information.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Get current user info
    response = await authenticated_client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")
    
    # Assert: Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    response_data = response.json()
    
    assert response_data["email"] == test_user["email"]
    assert response_data["is_active"] is True
    assert "id" in response_data
    assert "created_at" in response_data
    assert "is_verified" in response_data
    
    # Verify data matches database
    db_user = await User.find_one(User.email == test_user["email"])
    assert db_user is not None
    assert response_data["id"] == str(db_user.id)
    assert response_data["email"] == db_user.email


@pytest.mark.asyncio
async def test_get_current_user_without_auth(client: AsyncClient):
    """
    Test that getting current user without authentication returns 401.
    
    Args:
        client: HTTP client without authentication
    """
    # Act: Try to get current user without auth
    response = await client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")
    
    # Assert: Verify 401 response
    assert response.status_code == 401
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_get_current_user_deactivated(client: AsyncClient, test_user: dict):
    """
    Test that a deactivated user gets 403.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Deactivate the user in DB
    user = await User.find_one(User.email == test_user["email"])
    assert user is not None
    await user.set({"is_active": False})
    
    # Set the (still-valid) token on the client
    client.cookies.set("access_token", test_user["access_token"])
    
    # Act: Try to get current user
    response = await client.get(f"{AUTH_PREFIX}{AuthRoutes.ME}")
    
    # Assert: Verify 403 response
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
    assert "deactivated" in data["detail"].lower()
