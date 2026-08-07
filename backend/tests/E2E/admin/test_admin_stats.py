import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_unauthenticated_cannot_access_stats(client: AsyncClient):
    """Test that requests without auth token are rejected."""
    response = await client.get("/api/v0/admin/stats")
    assert response.status_code == 401


async def test_non_admin_cannot_access_stats(authenticated_client: AsyncClient):
    """Test that regular authenticated users cannot access admin stats."""
    response = await authenticated_client.get("/api/v0/admin/stats")
    assert response.status_code == 403


async def test_admin_can_access_stats_default(admin_client: AsyncClient):
    """Test fetching default 14d admin stats."""
    response = await admin_client.get("/api/v0/admin/stats")
    assert response.status_code == 200
    data = response.json()

    assert data["period"] == "14d"
    assert data["period_days"] == 14
    assert "summary" in data
    assert "acquisition" in data
    assert "engagement" in data

    # Verify summary fields
    assert "total_users" in data["summary"]
    assert "active_users_period" in data["summary"]

    # Verify acquisition fields
    assert "signups_today" in data["acquisition"]
    assert "daily_signups" in data["acquisition"]
    assert len(data["acquisition"]["daily_signups"]) == 14


async def test_admin_can_access_stats_custom_periods(admin_client: AsyncClient):
    """Test fetching stats with custom period parameters (7d, 30d, 90d)."""
    for period, expected_days in [("7d", 7), ("30d", 30), ("90d", 90)]:
        response = await admin_client.get(f"/api/v0/admin/stats?period={period}")
        assert response.status_code == 200
        data = response.json()
        assert data["period"] == period
        assert data["period_days"] == expected_days
        assert len(data["acquisition"]["daily_signups"]) == expected_days
