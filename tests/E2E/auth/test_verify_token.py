"""
E2E tests for JWT token verification.

Tests the happy path for the GET /api/v0/auth/verify endpoint.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from tests.config import AUTH_PREFIX


@pytest.mark.asyncio
async def test_verify_token_valid(authenticated_client: AsyncClient, test_user: dict):
    """
    Test verifying a valid JWT token.
    
    This test verifies that a valid JWT token returns user information.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Verify token
    response = await authenticated_client.get(f"{AUTH_PREFIX}{AuthRoutes.VERIFY}")
    
    # Assert: Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    response_data = response.json()
    
    assert response_data["email"] == test_user["email"]
    assert response_data["is_active"] is True
    assert "id" in response_data
    assert response_data["id"] == test_user["user_id"]
    
    # Verify data matches database
    db_user = await User.get(test_user["user_id"])
    assert db_user is not None
    assert response_data["email"] == db_user.email


@pytest.mark.asyncio
async def test_verify_token_invalid(client: AsyncClient):
    """
    Test verifying without a JWT token returns 403.
    
    Args:
        client: HTTP client without authentication
    """
    # Act: Try to verify without token
    response = await client.get(f"{AUTH_PREFIX}{AuthRoutes.VERIFY}")
    
    # Assert: Verify 401 response
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_verify_token_malformed(client: AsyncClient):
    """
    Test verifying a malformed JWT token returns 401.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Set malformed token as cookie
    client.cookies.set("access_token", "invalid_token_format")
    
    # Act: Try to verify with malformed token
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.VERIFY}",
    )
    
    # Assert: Verify 401 response
    assert response.status_code == 401
