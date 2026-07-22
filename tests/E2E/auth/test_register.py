"""
E2E tests for user registration.

Tests the POST /api/v0/auth/register endpoint.
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
async def test_register_password_max_length_72(client: AsyncClient):
    """
    Test that passwords up to 72 chars (bcrypt limit) work, and >72 are rejected.

    Args:
        client: HTTP client without authentication
    """
    # 72-char password should succeed
    password_72 = "a" * 72
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}",
        json={"email": "longpass@example.com", "password": password_72, "confirm_password": password_72}
    )
    assert response.status_code == 201, f"72-char password should work: {response.text}"

    # 73-char password should be rejected
    password_73 = "a" * 73
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}",
        json={"email": "toolong@example.com", "password": password_73, "confirm_password": password_73}
    )
    assert response.status_code == 422, f"73-char password should be rejected: {response.text}"


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


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """
    Test that registering with an already-taken email returns 400.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Create first user
    data = {
        "email": "dupe@example.com",
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!"
    }
    response = await client.post(f"{AUTH_PREFIX}{AuthRoutes.REGISTER}", json=data)
    assert response.status_code == 201
    
    # Act: Register again with same email
    response = await client.post(f"{AUTH_PREFIX}{AuthRoutes.REGISTER}", json=data)
    
    # Assert: Should reject duplicate
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "already exists" in data["detail"].lower()


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    """
    Test that a password shorter than 8 characters is rejected with 422.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Too-short password
    data = {
        "email": "shortpass@example.com",
        "password": "Ab1$",
        "confirm_password": "Ab1$"
    }
    
    # Act: Try to register
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}", json=data
    )
    
    # Assert: Verify 422 validation error
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_mismatched_passwords(client: AsyncClient):
    """
    Test that mismatched passwords are rejected with 400.
    
    Args:
        client: HTTP client without authentication
    """
    # Arrange: Mismatched passwords
    data = {
        "email": "mismatch@example.com",
        "password": "SecurePass123!",
        "confirm_password": "DifferentPass456!"
    }
    
    # Act: Try to register
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}", json=data
    )
    
    # Assert: Verify 400 error
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "match" in data["detail"].lower()
