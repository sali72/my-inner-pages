import pytest
from httpx import AsyncClient

from app.auth.db.models import User
from app.journals.db.models import Journal


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

    # Verify summary lifetime fields
    assert "lifetime" in data["summary"]
    assert "total_users" in data["summary"]["lifetime"]
    assert "total_journals" in data["summary"]["lifetime"]
    assert "total_chats" in data["summary"]["lifetime"]
    assert "verified_users" in data["summary"]["lifetime"]

    # Verify summary period fields
    assert "signups_current_period" in data["summary"]
    assert "active_users_period" in data["summary"]


async def test_admin_can_access_stats_with_journals(admin_client: AsyncClient):
    """Test fetching admin stats when journals exist to verify avg_journal_length calculation."""
    j1 = Journal(user_id="user123", content_text="Hello world")
    j2 = Journal(user_id="user123", content_text="Testing average length calculation")
    await j1.insert()
    await j2.insert()

    response = await admin_client.get("/api/v0/admin/stats")
    assert response.status_code == 200
    data = response.json()

    assert data["engagement"]["avg_journal_length"] > 0
    assert data["summary"]["lifetime"]["total_journals"] >= 2


async def test_admin_can_access_users_list(admin_client: AsyncClient):
    """Test fetching user directory with pagination and search."""
    response = await admin_client.get("/api/v0/admin/users?limit=10")
    assert response.status_code == 200
    data = response.json()

    assert "total" in data
    assert "users" in data
    assert len(data["users"]) > 0

    first_user = data["users"][0]
    assert "email" in first_user
    assert "role" in first_user
    assert "is_active" in first_user
    assert "auth_provider" in first_user
    assert "journal_count" in first_user
    assert "chat_count" in first_user
    assert "created_at" in first_user


async def test_admin_cannot_deactivate_self(admin_client: AsyncClient):
    """Test admin self-deactivation prevention."""
    me_resp = await admin_client.get("/api/v0/auth/me")
    assert me_resp.status_code == 200
    admin_id = me_resp.json()["id"]

    response = await admin_client.patch(
        f"/api/v0/admin/users/{admin_id}/status",
        json={"is_active": False},
    )
    assert response.status_code == 400
    assert "cannot change the status of your own admin account" in response.json()["detail"]


async def test_admin_can_toggle_user_status_and_delete(admin_client: AsyncClient):
    """Test admin deactivating a user account, then deleting it."""
    # Create target test user
    target_user = User(email="target_test_user@example.com", role="user", is_active=True)
    await target_user.insert()
    target_id = str(target_user.id)

    # Deactivate user
    deact_resp = await admin_client.patch(
        f"/api/v0/admin/users/{target_id}/status",
        json={"is_active": False},
    )
    assert deact_resp.status_code == 200
    assert deact_resp.json()["is_active"] is False

    # Delete user
    del_resp = await admin_client.delete(f"/api/v0/admin/users/{target_id}")
    assert del_resp.status_code == 204

    # Verify user no longer exists
    deleted_user = await User.get(target_id)
    assert deleted_user is None
