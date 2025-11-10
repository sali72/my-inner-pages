"""
E2E tests for user registration.

Tests the happy path for the POST /api/v0/auth/register endpoint.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from tests.config import AUTH_PREFIX


@pytest.mark.asyncio
async def test_register_user_happy_path(client: AsyncClient):
    """
    Test the happy path for user registration.
    
    This test verifies that a new user can successfully register
    and that the user is created in the database.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Prepare registration data
    registration_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!"
    }
    
    # Act: Register user
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}",
        json=registration_data
    )
    
    # Assert: Verify response
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    response_data = response.json()
    
    assert "message" in response_data
    assert "successful" in response_data["message"].lower()
    
    # Verify user exists in database
    db_user = await User.find_one(User.email == registration_data["email"])
    
    assert db_user is not None, "User should exist in database"
    assert db_user.email == registration_data["email"]
    assert db_user.is_active is True
    assert db_user.is_verified is False  # New users are not verified by default
    assert db_user.hashed_password is not None
    assert db_user.hashed_password != registration_data["password"]  # Should be hashed


@pytest.mark.asyncio
async def test_register_user_email_normalization(client: AsyncClient):
    """
    Test that email is normalized (lowercased) during registration.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Prepare registration data with mixed case email
    registration_data = {
        "email": "TestUser@EXAMPLE.COM",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!"
    }
    
    # Act: Register user
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}",
        json=registration_data
    )
    
    # Assert: Verify response
    assert response.status_code == 201
    
    # Verify user exists with normalized email
    db_user = await User.find_one(User.email == "testuser@example.com")
    
    assert db_user is not None
    assert db_user.email == "testuser@example.com"
