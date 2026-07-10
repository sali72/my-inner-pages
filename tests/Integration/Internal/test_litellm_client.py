import os
import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from app.ai.integrations.litellm_client import LiteLLMClient


@patch("app.ai.integrations.litellm_client.Router")
def test_litellm_client_initialization(mock_router, tmp_path):
    # Set environment variables
    os.environ["TEST_OPENROUTER_API_KEY"] = "test-openrouter-key"

    providers_config = [
        {
            "model_name": "default",
            "litellm_params": {
                "model": "openrouter/google/gemma-2-9b-it:free",
                "api_base": "https://openrouter.ai/api/v1",
                "api_key": "${TEST_OPENROUTER_API_KEY}"
            }
        }
    ]

    # Initialize client directly with model config list
    client = LiteLLMClient(model_list=providers_config)

    # Assert Router was initialized with resolved api_key
    mock_router.assert_called_once()
    called_args, called_kwargs = mock_router.call_args
    model_list = called_kwargs.get("model_list")
    
    assert model_list is not None
    assert len(model_list) == 1
    assert model_list[0]["litellm_params"]["api_key"] == "test-openrouter-key"
