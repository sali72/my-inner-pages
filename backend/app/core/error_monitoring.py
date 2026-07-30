"""Sentry error monitoring configuration and utilities."""
import os
import socket
from typing import Optional

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration


from app.core.logging import get_logger

logger = get_logger(__name__)


def get_container_id() -> Optional[str]:
    """Read container ID from cgroup for blue/green deploy debugging."""
    try:
        with open("/proc/self/cgroup") as f:
            for line in f:
                if "docker" in line:
                    return line.strip().split("/")[-1][:12]
    except Exception:
        pass
    try:
        with open("/proc/1/cgroup") as f:
            for line in f:
                parts = line.strip().split("/")
                for p in parts:
                    if len(p) == 64 and all(c in "0123456789abcdef" for c in p):
                        return p[:12]
    except Exception:
        pass
    return None


def init_sentry(
    dsn: Optional[str],
    environment: str,
    release: Optional[str] = None,
    traces_sample_rate: float = 0.1,
    profiles_sample_rate: float = 0.1,
) -> None:
    """Initialize Sentry SDK for error monitoring and performance tracing.

    Args:
        dsn: Sentry DSN. If None or empty, Sentry is disabled (no-op).
        environment: Environment name (e.g. 'development', 'production').
        release: Release version string (e.g. git tag).
        traces_sample_rate: Performance trace sampling rate (0.0-1.0).
        profiles_sample_rate: CPU profiling sampling rate (0.0-1.0).
    """
    if not dsn:
        logger.info("sentry_disabled", reason="no_dsn_configured")
        return

    container_id = get_container_id()

    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release,
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        integrations=[
            StarletteIntegration(transaction_style="url"),
            FastApiIntegration(transaction_style="url"),
        ],
        send_default_pii=False,
        max_request_body_size="medium",
        attach_stacktrace=True,
    )

    sentry_sdk.set_tag("container_id", container_id or "unknown")
    sentry_sdk.set_tag("hostname", socket.gethostname())

    logger.info(
        "sentry_initialized",
        environment=environment,
        release=release,
        container_id=container_id,
    )


def capture_exception(error: Exception, context: Optional[dict] = None) -> None:
    """Capture an exception with optional context to Sentry.

    Can be used anywhere in the codebase to report handled errors
    that still warrant attention (e.g. MongoDB retry exhaustion).
    """
    if context:
        sentry_sdk.set_context("error_context", context)
    sentry_sdk.capture_exception(error)
