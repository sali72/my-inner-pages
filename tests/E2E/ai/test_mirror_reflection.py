"""
E2E tests for mirror reflection generation.

Tests the happy path for the GET /api/v0/ai/mirror/reflection endpoint.
Uses mock LLM to avoid actual API costs.
"""

import pytest
from httpx import AsyncClient

from app.ai.api.config import MirrorRoutes
from tests.config import MIRROR_PREFIX


@pytest.mark.asyncio
async def test_get_reflection_without_journals(authenticated_client: AsyncClient, test_user: dict):
    """
    Test getting a reflection when user has no journal entries.
    
    This test verifies that the mirror provides a welcome reflection
    when the user hasn't written any journals yet.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Get reflection
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}"
    )
    
    # Assert: Verify response
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    response_data = response.json()
    
    assert "reflection" in response_data
    assert "mode" in response_data
    assert "available_modes" in response_data
    assert response_data["mode"] == "emotional"  # Default mode
    assert len(response_data["available_modes"]) == 4
    assert "emotional" in response_data["available_modes"]
    
    # Verify it's a welcome message
    reflection_text = response_data["reflection"].lower()
    assert "welcome" in reflection_text or "start" in reflection_text or "first" in reflection_text


@pytest.mark.asyncio
async def test_get_reflection_with_journals(authenticated_client: AsyncClient, test_user: dict):
    """
    Test getting a reflection when user has journal entries.
    
    This test creates some journals first and then verifies that
    the mirror provides a reflection based on them.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create some journal entries
    from tests.config import JOURNALS_PREFIX
    from app.journals.api.config import JournalRoutes
    
    journals = [
        {
            "title": "Great Day",
            "content": "Today was wonderful! I felt happy and accomplished.",
            "tags": ["positive", "growth"]
        },
        {
            "title": "Reflection Time",
            "content": "I'm learning to understand my emotions better and respond thoughtfully.",
            "tags": ["reflection"]
        },
        {
            "title": "Progress",
            "content": "I'm making progress on my goals. Small steps each day.",
            "tags": ["goals", "progress"]
        }
    ]
    
    for journal_data in journals:
        create_response = await authenticated_client.post(
            f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
            json=journal_data
        )
        assert create_response.status_code == 201
    
    # Act: Get reflection
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert "reflection" in response_data
    assert "mode" in response_data
    assert response_data["mode"] == "emotional"
    assert len(response_data["reflection"]) > 0
    
    # Verify it's NOT a welcome message (user has journals)
    reflection_text = response_data["reflection"].lower()
    assert "welcome" not in reflection_text or "recent" in reflection_text


@pytest.mark.asyncio
async def test_get_reflection_emotional_mode(authenticated_client: AsyncClient, test_user: dict):
    """
    Test getting a reflection with emotional mode explicitly specified.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Get reflection with emotional mode
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}?mode=emotional"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["mode"] == "emotional"
    assert "reflection" in response_data
    assert len(response_data["reflection"]) > 0


@pytest.mark.asyncio
async def test_get_reflection_cognitive_mode(authenticated_client: AsyncClient, test_user: dict):
    """
    Test getting a reflection with cognitive mode.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    from tests.config import JOURNALS_PREFIX
    from app.journals.api.config import JournalRoutes
    
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={
            "title": "Thinking Patterns",
            "content": "I notice I often assume the worst. Maybe I should question these thoughts.",
            "tags": ["cognitive"]
        }
    )
    
    # Act: Get reflection with cognitive mode
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}?mode=cognitive"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["mode"] == "cognitive"
    assert "reflection" in response_data
    
    # Cognitive reflections should mention thoughts/thinking/patterns
    reflection_text = response_data["reflection"].lower()
    assert any(word in reflection_text for word in ["thought", "thinking", "perspective", "cognitive", "pattern"])


@pytest.mark.asyncio
async def test_get_reflection_behavioral_mode(authenticated_client: AsyncClient, test_user: dict):
    """
    Test getting a reflection with behavioral mode.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    from tests.config import JOURNALS_PREFIX
    from app.journals.api.config import JournalRoutes
    
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={
            "title": "Daily Habits",
            "content": "I've been exercising every morning. It's becoming a habit.",
            "tags": ["habits", "action"]
        }
    )
    
    # Act: Get reflection with behavioral mode
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}?mode=behavioral"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["mode"] == "behavioral"
    assert "reflection" in response_data
    
    # Behavioral reflections should mention actions/behaviors
    reflection_text = response_data["reflection"].lower()
    assert any(word in reflection_text for word in ["action", "behavior", "habit", "respond", "behavioral"])


@pytest.mark.asyncio
async def test_get_reflection_relational_mode(authenticated_client: AsyncClient, test_user: dict):
    """
    Test getting a reflection with relational mode.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    from tests.config import JOURNALS_PREFIX
    from app.journals.api.config import JournalRoutes
    
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={
            "title": "Connections",
            "content": "Had a great conversation with a friend today. Our connection deepened.",
            "tags": ["relationships", "friendship"]
        }
    )
    
    # Act: Get reflection with relational mode
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}?mode=relational"
    )
    
    # Assert: Verify response
    assert response.status_code == 200
    response_data = response.json()
    
    assert response_data["mode"] == "relational"
    assert "reflection" in response_data
    
    # Relational reflections should mention relationships/connections
    reflection_text = response_data["reflection"].lower()
    assert any(word in reflection_text for word in ["relationship", "connection", "interact", "relational", "social"])


@pytest.mark.asyncio
async def test_get_reflection_invalid_mode(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that invalid mode falls back to default (emotional).
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Act: Try to get reflection with invalid mode
    response = await authenticated_client.get(
        f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}?mode=invalid_mode"
    )
    
    # Assert: Should succeed but use default mode
    assert response.status_code == 200
    response_data = response.json()
    
    # Should fall back to emotional mode
    assert response_data["mode"] == "emotional"
    assert "reflection" in response_data


@pytest.mark.asyncio
async def test_get_reflection_without_auth(client: AsyncClient):
    """
    Test that getting reflection without authentication returns 403.
    
    Args:
        client: HTTP client without authentication
    """
    # Act: Try to get reflection without auth
    response = await client.get(f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}")
    
    # Assert: Verify 403 response
    assert response.status_code == 403
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_reflection_consistency_across_modes(authenticated_client: AsyncClient, test_user: dict):
    """
    Test that all modes return valid reflections.
    
    Args:
        authenticated_client: HTTP client with authentication headers
        test_user: Test user fixture with credentials
    """
    # Arrange: Create a journal entry
    from tests.config import JOURNALS_PREFIX
    from app.journals.api.config import JournalRoutes
    
    await authenticated_client.post(
        f"{JOURNALS_PREFIX}{JournalRoutes.ROOT}",
        json={
            "title": "Multi-faceted Day",
            "content": "Today I experienced many things - emotions, thoughts, actions, and connections.",
            "tags": ["comprehensive"]
        }
    )
    
    modes = ["emotional", "cognitive", "behavioral", "relational"]
    
    for mode in modes:
        # Act: Get reflection for each mode
        response = await authenticated_client.get(
            f"{MIRROR_PREFIX}{MirrorRoutes.REFLECTION}?mode={mode}"
        )
        
        # Assert: All modes should succeed
        assert response.status_code == 200, f"Mode {mode} failed"
        response_data = response.json()
        
        assert response_data["mode"] == mode
        assert len(response_data["reflection"]) > 0
        assert response_data["available_modes"] == modes
