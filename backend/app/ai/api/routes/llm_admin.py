from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.ai.api.schemas.llm_admin import (
    ProviderConfigSchema,
    DiagnosticsResponse,
)
from app.ai.deps import get_llm_admin_service
from app.ai.services.llm_admin_service import LLMAdminService
from app.auth.db.models import User
from app.auth.deps import get_current_admin_user
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/admin/llm", tags=["llm-admin"])


@router.get(
    "/providers",
    response_model=List[ProviderConfigSchema],
    summary="Get configured LLM providers from database with obfuscated keys",
)
async def get_providers(
    current_user: User = Depends(get_current_admin_user),
    service: LLMAdminService = Depends(get_llm_admin_service),
):
    """
    Retrieve all LLM providers from MongoDB. API keys are returned
    in an obfuscated format to prevent secret exposure in the frontend.
    """
    try:
        return await service.get_providers()
    except Exception as e:
        logger.error("admin_get_providers_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load LLM providers",
        )


@router.put(
    "/providers",
    summary="Update LLM providers configuration in database, preserving keys",
)
async def update_providers(
    providers_list: List[ProviderConfigSchema],
    current_user: User = Depends(get_current_admin_user),
    service: LLMAdminService = Depends(get_llm_admin_service),
):
    """
    Overwrite the LLMProvider collection. If incoming payload contains an obfuscated
    API key format, the original key value from the existing database record is preserved.
    """
    try:
        return await service.update_providers(providers_list)
    except Exception as e:
        logger.error("admin_update_providers_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update LLM providers configuration",
        )


@router.post(
    "/reload",
    summary="Force reload LLM configuration from database",
)
async def force_reload_providers(
    current_user: User = Depends(get_current_admin_user),
    service: LLMAdminService = Depends(get_llm_admin_service),
):
    """
    Force clear the cache and reload configuration from MongoDB.
    """
    try:
        return await service.reload_providers()
    except Exception as e:
        logger.error("admin_reload_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reload LLM client",
        )


@router.post(
    "/test",
    response_model=DiagnosticsResponse,
    summary="Test and diagnose all configured LLM providers in database",
)
async def test_providers(
    current_user: User = Depends(get_current_admin_user),
    service: LLMAdminService = Depends(get_llm_admin_service),
):
    """
    Probes all configured LLM providers in parallel, bypasses the router,
    and returns latency and success/failure statistics.
    """
    try:
        return await service.test_providers()
    except Exception as e:
        logger.error("admin_test_providers_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to query providers from database",
        )
