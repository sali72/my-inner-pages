from typing import List
from app.ai.db.models import LLMProvider


class LLMProviderRepository:
    """Repository for managing LLMProvider documents in MongoDB."""

    async def get_active_providers(self) -> List[LLMProvider]:
        """Fetch all active LLM providers sorted by priority order."""
        return await LLMProvider.find(LLMProvider.is_active == True).sort(+LLMProvider.order).to_list()

    async def get_all_providers(self) -> List[LLMProvider]:
        """Fetch all LLM providers sorted by priority order."""
        return await LLMProvider.find_all().sort(+LLMProvider.order).to_list()

    async def replace_providers(self, providers: List[LLMProvider]) -> List[LLMProvider]:
        """Replace the entire set of LLM providers in the database atomically (delete all + insert new)."""
        await LLMProvider.find_all().delete()
        for doc in providers:
            await doc.insert()
        return providers
