"""
E2E tests for JWT token verification.

Tests the GET /api/v0/auth/verify endpoint.
"""

import jwt as pyjwt
import pytest
import uuid
import time
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from app.core.config import Settings
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
    Test verifying without a JWT token returns 401.
    
    Args:
        client: HTTP client without authentication
    """
    # Act: Try to verify without token
    response = await client.get(f"{AUTH_PREFIX}{AuthRoutes.VERIFY}")
    
    # Assert: Verify 401 response
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_verify_token_expired(client: AsyncClient, test_user: dict, test_settings: Settings):
    """
    Test verifying an expired JWT token returns 401.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
        test_settings: Test settings (contains jwt_secret_key)
    """
    # Arrange: Create an expired token
    expired_payload = {
        "sub": test_user["user_id"],
        "email": test_user["email"],
        "type": "access",
        "jti": str(uuid.uuid4()),
        "exp": int(time.time()) - 3600,  # 1 hour ago
    }
    expired_token = pyjwt.encode(
        expired_payload, test_settings.jwt_secret_key, algorithm="HS256"
    )
    
    # Act: Verify with expired token (use Cookie header to avoid httpx jar issues)
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.VERIFY}",
        headers={"Cookie": f"access_token={expired_token}"},
    )
    
    # Assert: Verify 401 response
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_verify_token_tampered(client: AsyncClient, test_user: dict):
    """
    Test verifying a tampered JWT returns 401.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Corrupt the last character of the token
    original_token = test_user["access_token"]
    tampered_token = original_token[:-1] + ("X" if original_token[-1] != "X" else "Y")
    
    client.cookies.clear()
    # Act: Verify with tampered token
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.VERIFY}",
        cookies={"access_token": tampered_token},
    )
    
    # Assert: Verify 401 response
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_verify_token_deleted_user(client: AsyncClient, test_user: dict):
    """
    Test that a valid JWT for a deleted user returns 401.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Delete the user from DB
    user = await User.find_one(User.email == test_user["email"])
    assert user is not None
    await user.delete()
    
    client.cookies.clear()
    # Act: Verify with token for deleted user
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.VERIFY}",
        cookies={"access_token": test_user["access_token"]},
    )
    
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
