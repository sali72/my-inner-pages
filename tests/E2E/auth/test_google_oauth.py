"""
E2E tests for Google OAuth flow.

Tests the GET /api/v0/auth/google/login and /api/v0/auth/google/callback endpoints.
External HTTP calls (code exchange, userinfo) are mocked via dependency override.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from app.auth.services.google_oauth_service import GoogleTokens, GoogleUserInfo
from app.auth.api.routes.google import get_google_oauth_service
from tests.config import AUTH_PREFIX


class MockGoogleOAuthService:
    """Fake GoogleOAuthService that never reaches Google's servers."""

    def __init__(self, *args, **kwargs):
        self._state = "test-state-jwt"

    def generate_state(self):
        return self._state

    def validate_state(self, state):
        return state == self._state

    def get_authorization_url(self, state):
        return f"https://accounts.google.com/o/oauth2/v2/auth?state={state}"

    async def exchange_code(self, code):
        return GoogleTokens(
            access_token="mock-google-access-token",
            id_token="mock-google-id-token",
        )

    async def get_user_info(self, access_token):
        return GoogleUserInfo(
            sub="google-sub-12345",
            email="googleuser@example.com",
            email_verified=True,
            name="Google User",
        )

    async def close(self):
        pass


@pytest_asyncio.fixture
async def mock_google(app):
    """Override the GoogleOAuthService dependency with a mock."""
    mock = MockGoogleOAuthService()
    app.dependency_overrides[get_google_oauth_service] = lambda: mock
    yield mock
    app.dependency_overrides.pop(get_google_oauth_service, None)


@pytest.mark.asyncio
async def test_google_login_redirect(client: AsyncClient):
    """
    Test that GET /auth/google/login redirects to Google's consent screen.

    Args:
        client: HTTP client without authentication
    """
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.GOOGLE_LOGIN}",
        follow_redirects=False,
    )

    assert response.status_code in (302, 307)
    location = response.headers.get("location", "")
    assert "accounts.google.com" in location


@pytest.mark.asyncio
async def test_google_callback_invalid_state(client: AsyncClient, mock_google: MockGoogleOAuthService):
    """
    Test that an invalid state parameter returns 400.

    Args:
        client: HTTP client without authentication
        mock_google: Mock Google OAuth service
    """
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.GOOGLE_CALLBACK}",
        params={"code": "some-code", "state": "invalid-state"},
        follow_redirects=False,
    )

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "state" in data["detail"].lower()


@pytest.mark.asyncio
async def test_google_callback_creates_new_user(
    client: AsyncClient, mock_google: MockGoogleOAuthService,
):
    """
    Test that a first-time Google sign-up creates a user and redirects with cookies.

    Args:
        client: HTTP client without authentication
        mock_google: Mock Google OAuth service
    """
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.GOOGLE_CALLBACK}",
        params={"code": "valid-code", "state": mock_google._state},
        follow_redirects=False,
    )

    # Should redirect to frontend
    assert response.status_code in (302, 307)

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "session_exists=" in set_cookie

    # User should exist in DB with google_id set and email verified
    user = await User.find_one(User.email == "googleuser@example.com")
    assert user is not None
    assert user.google_id == "google-sub-12345"
    assert user.is_verified is True
    assert user.hashed_password is None


@pytest.mark.asyncio
async def test_google_callback_links_existing_email(
    client: AsyncClient, mock_google: MockGoogleOAuthService,
):
    """
    Test that signing in with Google on an existing email/password account
    links the google_id and marks the account verified.

    Args:
        client: HTTP client without authentication
        mock_google: Mock Google OAuth service
    """
    # Arrange: Create a user with the same email via normal registration
    import uuid
    email = f"linktest{uuid.uuid4().hex[:8]}@example.com"
    reg_data = {
        "email": email,
        "password": "SecurePass123!",
        "confirm_password": "SecurePass123!",
    }
    reg_response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.REGISTER}", json=reg_data
    )
    assert reg_response.status_code == 201

    # Verify user exists, unverified, no google_id
    user_before = await User.find_one(User.email == email)
    assert user_before is not None
    assert user_before.google_id is None
    assert user_before.is_verified is False

    # Override get_user_info to return our dynamic email
    original_get_info = mock_google.get_user_info

    async def get_user_info_with_email(access_token):
        return GoogleUserInfo(
            sub="google-sub-link-56789",
            email=email,
            email_verified=True,
            name="Linked User",
        )
    mock_google.get_user_info = get_user_info_with_email

    # Act: Google callback
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.GOOGLE_CALLBACK}",
        params={"code": "valid-code", "state": mock_google._state},
        follow_redirects=False,
    )

    # Assert: Should succeed (redirect)
    assert response.status_code in (302, 307)

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "session_exists=" in set_cookie

    # User should now have google_id linked and be verified
    user_after = await User.find_one(User.email == email)
    assert user_after is not None
    assert user_after.google_id == "google-sub-link-56789"
    assert user_after.is_verified is True


@pytest.mark.asyncio
async def test_google_callback_returns_existing_linked_user(
    client: AsyncClient, mock_google: MockGoogleOAuthService,
):
    """
    Test that a returning Google user (already linked) gets redirected
    without creating a duplicate.

    Args:
        client: HTTP client without authentication
        mock_google: Mock Google OAuth service
    """
    # Arrange: Create user already linked to Google
    import uuid
    email = f"returning{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        email=email,
        google_id="google-sub-12345",
        is_verified=True,
    )
    await user.insert()

    # Act: Google callback
    response = await client.get(
        f"{AUTH_PREFIX}{AuthRoutes.GOOGLE_CALLBACK}",
        params={"code": "valid-code", "state": mock_google._state},
        follow_redirects=False,
    )

    # Assert
    assert response.status_code in (302, 307)

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "session_exists=" in set_cookie

    # Should still be exactly one user with this email
    count = await User.find(User.email == email).count()
    assert count == 1
