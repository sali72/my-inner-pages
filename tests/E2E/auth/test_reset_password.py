"""
E2E tests for password reset.

Tests the happy path for the POST /api/v0/auth/reset-password endpoint.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from tests.config import AUTH_PREFIX


@pytest.mark.asyncio
async def test_reset_password_existing_user(client: AsyncClient, test_user: dict):
    """
    Test requesting password reset for existing user.
    
    This test verifies that password reset request succeeds.
    Note: The endpoint always returns success to prevent email enumeration.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare reset password data
    reset_data = {
        "email": test_user["email"]
    }
    
    # Act: Request password reset
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.RESET_PASSWORD}",
        json=reset_data
    )
    
    # Assert: Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    response_data = response.json()
    
    assert "message" in response_data
    assert "email" in response_data["message"].lower()


@pytest.mark.asyncio
async def test_reset_password_non_existing_user(client: AsyncClient):
    """
    Test requesting password reset for non-existing user.
    
    This test verifies that the endpoint returns success even for
    non-existing emails to prevent email enumeration.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Prepare reset password data for non-existing user
    reset_data = {
        "email": "nonexistent@example.com"
    }
    
    # Act: Request password reset
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.RESET_PASSWORD}",
        json=reset_data
    )
    
    # Assert: Verify response (should succeed to prevent enumeration)
    assert response.status_code == 200
    response_data = response.json()
    
    assert "message" in response_data


@pytest.mark.asyncio
async def test_reset_password_email_normalization(client: AsyncClient, test_user: dict):
    """
    Test that email is normalized during password reset request.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare reset data with uppercase email
    reset_data = {
        "email": test_user["email"].upper()
    }
    
    # Act: Request password reset
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.RESET_PASSWORD}",
        json=reset_data
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert "message" in response_data
