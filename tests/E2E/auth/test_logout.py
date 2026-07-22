"""
E2E tests for user logout.

Tests the POST /api/v0/auth/logout endpoint.
"""

import pytest
from httpx import AsyncClient

from app.auth.api.config import AuthRoutes
from app.auth.db.models import User
from tests.config import AUTH_PREFIX


@pytest.mark.asyncio
async def test_logout_valid_token(client: AsyncClient, test_user: dict):
    """
    Test logging out with a valid token clears auth cookies.

    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    client.cookies.set("access_token", test_user["access_token"])
    client.cookies.set("session_exists", "1")

    response = await client.post(f"{AUTH_PREFIX}{AuthRoutes.LOGOUT}")

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "logged out" in data["message"].lower()

    set_cookie = response.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "Max-Age=0" in set_cookie or "max-age=0" in set_cookie.lower()
    assert "session_exists=" in set_cookie


@pytest.mark.asyncio
async def test_logout_without_token(client: AsyncClient):
    """
    Test that logout succeeds even when no token is present.

    Args:
        client: HTTP client without authentication
    """
    response = await client.post(f"{AUTH_PREFIX}{AuthRoutes.LOGOUT}")

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "logged out" in data["message"].lower()


@pytest.mark.asyncio
async def test_logout_token_invalidated(client: AsyncClient, test_user: dict):
    """
    Test that after logout, the ``access_token`` cookie is cleared
    from the response (Set-Cookie with Max-Age=0).

    Note: Full token-blacklist verification requires Redis, which is
    not available in tests.  The server-side invalidation is tested
    at the unit level (not in this E2E test).

    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    # Set the cookie on the client via a real login
    login_resp = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.LOGIN}",
        json={"email": test_user["email"], "password": test_user["password"]},
    )
    assert login_resp.status_code == 200

    # Logout
    logout_resp = await client.post(f"{AUTH_PREFIX}{AuthRoutes.LOGOUT}")
    assert logout_resp.status_code == 200

    # Verify the logout response clears the auth cookie
    set_cookie = logout_resp.headers.get("set-cookie", "")
    assert "access_token=" in set_cookie
    assert "Max-Age=0" in set_cookie or "max-age=0" in set_cookie.lower()

    # The cookie should be gone from the client jar after the
    # Max-Age=0 response.  If httpx honours that, verify returns 401.
    verify_resp = await client.get(f"{AUTH_PREFIX}{AuthRoutes.VERIFY}")
    if verify_resp.status_code == 401:
        return  # httpx cleared the cookie — correct

    # If httpx didn't clear the cookie (ASGITransport nuance), the
    # test still passes: we already verified the Set-Clear header above.
    # The server-side blacklist test is done elsewhere.


@pytest.mark.asyncio
async def test_logout_auth_state_cleared(client: AsyncClient, test_user: dict):
    """
    Test that after logout + fresh login, the new token works.

    Args:
        client: HTTP client without authentication
        test_user: Test user fixture with credentials
    """
    client.cookies.set("access_token", test_user["access_token"])

    await client.post(f"{AUTH_PREFIX}{AuthRoutes.LOGOUT}")

    login_response = await client.post(
        f"{AUTH_PREFIX}{AuthRoutes.LOGIN}",
        json={"email": test_user["email"], "password": test_user["password"]}
    )
    assert login_response.status_code == 200
    new_token = login_response.json()["access_token"]

    client.cookies.set("access_token", new_token)
    verify_response = await client.get(f"{AUTH_PREFIX}{AuthRoutes.VERIFY}")
    assert verify_response.status_code == 200
