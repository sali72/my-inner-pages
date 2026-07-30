#!/usr/bin/env python3
import asyncio
import os
import string
import time
import motor.motor_asyncio
from beanie import init_beanie
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from app.core.config import Settings
from app.ai.db.models import LLMProvider
import litellm

# Colors for nice console printing
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


async def probe_provider(index: int, provider: LLMProvider) -> dict:
    """Test a single LLM provider deployment directly (bypassing the router failover)."""
    litellm_params = provider.litellm_params
    raw_model = litellm_params.model
    api_base = litellm_params.api_base
    
    # Resolve env variables
    model = string.Template(raw_model).safe_substitute(os.environ)
    api_base_resolved = string.Template(api_base).safe_substitute(os.environ) if api_base else None
    
    # Resolve API Key
    api_key_template = litellm_params.api_key or ""
    api_key = string.Template(api_key_template).safe_substitute(os.environ) if api_key_template else None
    
    if api_key and api_key.startswith("${") and api_key.endswith("}"):
        env_var_name = api_key[2:-1]
        api_key = os.getenv(env_var_name)

    status_prefix = "[ACTIVE]" if provider.is_active else "[INACTIVE]"
    print(f"Testing model {index} {status_prefix}: {model} (base: {api_base_resolved or 'default'})...")

    test_messages = [{"role": "user", "content": "Respond with the word 'pong' and nothing else."}]
    start_time = time.time()
    
    try:
        kwargs = {
            "model": model,
            "messages": test_messages,
            "max_tokens": 5,
            "timeout": 15,
        }
        if api_base_resolved:
            kwargs["api_base"] = api_base_resolved
        if api_key:
            kwargs["api_key"] = api_key

        response = await litellm.acompletion(**kwargs)
        latency = time.time() - start_time
        content = response.choices[0].message.content
        response_text = (content or "").strip()
        
        if not response_text:
            return {
                "index": index,
                "model": model,
                "status": "FAILED",
                "latency": latency,
                "details": "Error: Empty response received",
            }

        return {
            "index": index,
            "model": model,
            "status": "WORKING",
            "latency": latency,
            "details": f"Response: '{response_text}'",
        }
    except Exception as e:
        latency = time.time() - start_time
        error_msg = str(e).split("\n")[0]
        return {
            "index": index,
            "model": model,
            "status": "FAILED",
            "latency": latency,
            "details": f"Error: {error_msg}",
        }


async def main():
    print(f"{BOLD}{BLUE}=== LLM Providers Database Diagnostics ==={RESET}")
    
    # Initialize Beanie connection to MongoDB
    settings = Settings()
    print(f"Connecting to MongoDB: {settings.database_name}...")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongo_url)
    try:
        await init_beanie(
            database=client[settings.database_name],
            document_models=[LLMProvider]
        )
    except Exception as e:
        print(f"{RED}Error: Failed to initialize Beanie connection: {e}{RESET}")
        return

    # Fetch all providers from database
    providers = await LLMProvider.find_all().sort(+LLMProvider.order).to_list()

    if not providers:
        print(f"{YELLOW}No providers found in MongoDB collection 'llm_providers'.{RESET}")
        print("Please start the backend server to auto-seed default configs, then try again.")
        return

    print(f"Found {len(providers)} provider deployments in database. Testing concurrently...\n")

    # Run tests concurrently
    tasks = [probe_provider(i + 1, p) for i, p in enumerate(providers)]
    results = await asyncio.gather(*tasks)

    # Sort results
    results.sort(key=lambda r: r["index"])

    # Output formatted ASCII table
    print("\n" + "=" * 100)
    print(f"{BOLD}{'#':<3} | {'Model':<50} | {'Status':<10} | {'Latency':<9} | {'Details'}{RESET}")
    print("-" * 100)
    
    for idx, r in enumerate(results):
        provider = providers[idx]
        status_color = GREEN if r["status"] == "WORKING" else RED
        latency_str = f"{r['latency']:.2f}s"
        
        status_txt = r["status"]
        if not provider.is_active:
            status_txt = f"{r['status']} (INACTIVE)"
            
        status_formatted = f"{status_color}{status_txt:<10}{RESET}"
        print(f"{r['index']:<3} | {r['model']:<50} | {status_formatted} | {latency_str:<9} | {r['details']}")
    
    print("=" * 100)

    # Summary statistics
    working = sum(1 for r in results if r["status"] == "WORKING")
    failed = len(results) - working
    
    print(f"\n{BOLD}Summary:{RESET}")
    print(f"  Total models: {len(results)}")
    print(f"  {GREEN}Working: {working}{RESET}")
    if failed > 0:
        print(f"  {RED}Failed: {failed}{RESET}")
    else:
        print(f"  {GREEN}All systems functional!{RESET}")


if __name__ == "__main__":
    asyncio.run(main())
