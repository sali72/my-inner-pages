"""Tests for rate limiting functionality.

Verifies that slowapi correctly enforces per-IP rate limits on auth endpoints,
and that per-user rate limits work for the mirror endpoint.
"""

import pytest
from httpx import AsyncClient
from limits import RateLimitItemPerMinute
from app.core.rate_limit import limiter


AUTH_LOGIN = "/api/v0/auth/login"
AUTH_REGISTER = "/api/v0/auth/register"
AUTH_RESET_PASSWORD = "/api/v0/auth/reset-password"
MIRROR_REFLECTION = "/api/v0/mirror/reflection"


@pytest.mark.asyncio
async def test_login_rate_limit_exceeded(client: AsyncClient):
    """POST /auth/login should return 429 after 5 rapid attempts."""
    payload = {"email": "nobody@example.com", "password": "wrongpass"}
    for _ in range(5):
        resp = await client.post(AUTH_LOGIN, json=payload)
        # First 5 should pass (401 because bad credentials, not 429)
        assert resp.status_code != 429, f"Unexpected 429 on attempt {_+1}"

    # 6th attempt should be blocked
    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 429
    body = resp.json()
    assert "detail" in body


@pytest.mark.asyncio
async def test_rate_limit_resets_after_window(client: AsyncClient):
    """Rate limit should reset after the window expires.

    We verify by clearing the limiter storage to simulate window expiry.
    """
    limiter.reset()

    payload = {"email": "nobody@example.com", "password": "wrongpass"}
    for _ in range(5):
        await client.post(AUTH_LOGIN, json=payload)
    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 429

    # Simulate window expiry by resetting storage
    limiter.reset()

    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 401  # Back to normal (bad credentials)


@pytest.mark.asyncio
async def test_different_keys_independent_limits(client: AsyncClient):
    """Different rate limit keys should have independent counters."""
    limiter.reset()

    payload = {"email": "nobody@example.com", "password": "wrongpass"}
    for _ in range(5):
        await client.post(AUTH_LOGIN, json=payload)

    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 429

    # Same client IP is still limited
    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 429

    # A different key in the rate limiter storage should be independent
    allowed = limiter.limiter.hit(RateLimitItemPerMinute(5), "other-key")
    assert allowed is True


@pytest.mark.asyncio
async def test_rate_limit_429_has_detail(client: AsyncClient):
    """429 response should include a detail message."""
    limiter.reset()

    payload = {"email": "nobody@example.com", "password": "wrongpass"}
    for _ in range(5):
        await client.post(AUTH_LOGIN, json=payload)

    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 429
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_register_rate_limited(client: AsyncClient):
    """POST /auth/register should also be rate limited."""
    limiter.reset()

    payload = {
        "email": "spam@example.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
    }
    for _ in range(5):
        resp = await client.post(AUTH_REGISTER, json=payload)
        assert resp.status_code != 429

    resp = await client.post(AUTH_REGISTER, json=payload)
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_reset_password_rate_limited(client: AsyncClient):
    """POST /auth/reset-password should be rate limited."""
    limiter.reset()

    payload = {"email": "nobody@example.com"}
    for _ in range(5):
        resp = await client.post(AUTH_RESET_PASSWORD, json=payload)
        assert resp.status_code != 429

    resp = await client.post(AUTH_RESET_PASSWORD, json=payload)
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_mirror_rate_limit_per_user(authenticated_client: AsyncClient):
    """GET /mirror/reflection should enforce per-user rate limit of 10/minute."""
    limiter.reset()

    for _ in range(10):
        resp = await authenticated_client.get(MIRROR_REFLECTION)
        assert resp.status_code != 429, f"Unexpected 429 on attempt {_+1}"

    resp = await authenticated_client.get(MIRROR_REFLECTION)
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_mirror_rate_limit_independent_users(
    authenticated_client: AsyncClient,
    another_test_user: dict,
    client: AsyncClient,
):
    """Two different users should have independent mirror rate limit counters."""
    limiter.reset()

    # Exhaust user A's limit
    for _ in range(10):
        resp = await authenticated_client.get(MIRROR_REFLECTION)
        assert resp.status_code != 429

    resp = await authenticated_client.get(MIRROR_REFLECTION)
    assert resp.status_code == 429

    # User B (different token) should have a fresh counter
    client.headers.update({"Authorization": f"Bearer {another_test_user['access_token']}"})
    resp = await client.get(MIRROR_REFLECTION)
    assert resp.status_code != 429


@pytest.mark.asyncio
async def test_x_real_ip_key(client: AsyncClient):
    """X-Real-IP header should be used as the rate limit key."""
    limiter.reset()

    payload = {"email": "nobody@example.com", "password": "wrongpass"}

    # Use a custom X-Real-IP to get a predictable key
    headers = {"X-Real-IP": "10.0.0.1"}
    for _ in range(5):
        resp = await client.post(AUTH_LOGIN, json=payload, headers=headers)
        assert resp.status_code != 429

    # 6th request with the same X-Real-IP should be blocked
    resp = await client.post(AUTH_LOGIN, json=payload, headers=headers)
    assert resp.status_code == 429

    # A different X-Real-IP should have its own counter
    headers2 = {"X-Real-IP": "10.0.0.2"}
    resp = await client.post(AUTH_LOGIN, json=payload, headers=headers2)
    assert resp.status_code != 429


@pytest.mark.asyncio
async def test_retry_after_header(client: AsyncClient):
    """429 responses should include a Retry-After header."""
    limiter.reset()

    payload = {"email": "nobody@example.com", "password": "wrongpass"}
    for _ in range(5):
        await client.post(AUTH_LOGIN, json=payload)

    resp = await client.post(AUTH_LOGIN, json=payload)
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers
