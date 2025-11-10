"""
E2E tests for user login.

Tests the happy path for the POST /api/v0/auth/login endpoint.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from tests.config import AUTH_PREFIX


@pytest.mark.asyncio
async def test_login_happy_path(client: AsyncClient, test_user: dict):
    """
    Test the happy path for user login.
    
    This test verifies that a registered user can successfully login
    and receive a valid access token.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare login data
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    
    # Act: Login
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.LOGIN}",
        json=login_data
    )
    
    # Assert: Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    response_data = response.json()
    
    assert "access_token" in response_data
    assert response_data["token_type"] == "bearer"
    assert "user" in response_data
    
    # Verify user data in response
    user_data = response_data["user"]
    assert user_data["email"] == test_user["email"]
    assert user_data["is_active"] is True
    assert "id" in user_data
    assert "created_at" in user_data
    
    # Verify last_login is updated in database
    db_user = await User.find_one(User.email == test_user["email"])
    assert db_user is not None
    assert db_user.last_login is not None


@pytest.mark.asyncio
async def test_login_with_uppercase_email(client: AsyncClient, test_user: dict):
    """
    Test that login works with email in different case.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare login data with uppercase email
    login_data = {
        "email": test_user["email"].upper(),
        "password": test_user["password"]
    }
    
    # Act: Login
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.LOGIN}",
        json=login_data
    )
    
    # Assert: Verify successful login
    assert response.status_code == 200
    response_data = response.json()
    
    assert "access_token" in response_data
    assert response_data["user"]["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_login_with_invalid_credentials(client: AsyncClient, test_user: dict):
    """
    Test login with invalid password returns 401.
    
    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Arrange: Prepare login data with wrong password
    login_data = {
        "email": test_user["email"],
        "password": "WrongPassword123!"
    }
    
    # Act: Attempt login
    response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.LOGIN}",
        json=login_data
    )
    
    # Assert: Verify 401 response
    assert response.status_code == 401
    assert "detail" in response.json()
