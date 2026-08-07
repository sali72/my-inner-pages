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


async def test_admin_can_access_stats(admin_client: AsyncClient):
    """Test that an admin user can fetch operational statistics."""
    response = await admin_client.get("/api/v0/admin/stats")
    assert response.status_code == 200
    data = response.json()

    assert "summary" in data
    assert "acquisition" in data
    assert "engagement" in data

    # Verify summary fields
    assert "total_users" in data["summary"]
    assert "dau" in data["summary"]
    assert "total_journals" in data["summary"]
    assert "total_chats" in data["summary"]

    # Verify acquisition fields
    assert "signups_today" in data["acquisition"]
    assert "daily_signups" in data["acquisition"]
    assert len(data["acquisition"]["daily_signups"]) == 14

    # Verify engagement fields
    assert "stickiness" in data["engagement"]
    assert "return_rate" in data["engagement"]
