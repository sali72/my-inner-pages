import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt as pyjwt
import httpx

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class GoogleTokens:
    access_token: str
    id_token: str


@dataclass
class GoogleUserInfo:
    sub: str          # Stable numeric Google ID (never changes)
    email: str
    email_verified: bool
    name: str | None = None
    picture: str | None = None


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class GoogleOAuthService:
    """Exchange an OAuth 2.0 authorization code for a Google identity and
    retrieve basic user information."""

    AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def __init__(self, settings: Settings, jwt_secret: str):
        self.client_id = settings.google_client_id
        self.client_secret = settings.google_client_secret
        self.redirect_uri = settings.google_redirect_uri
        self._jwt_secret = jwt_secret
        self._http = httpx.AsyncClient(timeout=10.0)

    # ------------------------------------------------------------------
    # Step 1 – Build the consent URL
    # ------------------------------------------------------------------

    def get_authorization_url(self, state: str) -> str:
        """Build the Google OAuth consent URL the browser should redirect to."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",   # enables refresh_token for future use
            "prompt": "select_account",
        }
        from urllib.parse import urlencode
        return f"{self.AUTHORIZATION_URL}?{urlencode(params)}"

    # ------------------------------------------------------------------
    # Step 2 – Exchange code for tokens (server-side only)
    # ------------------------------------------------------------------

    async def exchange_code(self, code: str) -> GoogleTokens:
        """Exchange the authorisation code for access + ID tokens."""
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        resp = await self._http.post(self.TOKEN_URL, data=data)
        resp.raise_for_status()
        body: dict[str, Any] = resp.json()
        return GoogleTokens(
            access_token=body["access_token"],
            id_token=body["id_token"],
        )

    # ------------------------------------------------------------------
    # Step 3 – Retrieve verified user info
    # ------------------------------------------------------------------

    async def get_user_info(self, access_token: str) -> GoogleUserInfo:
        """Retrieve the authenticated user's profile from Google."""
        resp = await self._http.get(
            self.USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        body: dict[str, Any] = resp.json()
        return GoogleUserInfo(
            sub=body["id"],
            email=body["email"],
            email_verified=body.get("verified_email", False),
            name=body.get("name"),
            picture=body.get("picture"),
        )

    # ------------------------------------------------------------------
    # OAuth state management (prevents CSRF on the callback)
    # ------------------------------------------------------------------

    def generate_state(self) -> str:
        """Return a signed JWT to use as the OAuth ``state`` parameter.

        The JWT contains a random nonce and a 10-minute expiry so the
        callback can verify the request came from us.
        """
        payload = {
            "jti": str(uuid.uuid4()),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
        }
        return pyjwt.encode(payload, self._jwt_secret, algorithm="HS256")

    def validate_state(self, state: str) -> bool:
        """Return ``True`` if the state JWT is valid and not expired."""
        try:
            pyjwt.decode(state, self._jwt_secret, algorithms=["HS256"])
            return True
        except pyjwt.PyJWTError:
            return False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def close(self) -> None:
        await self._http.aclose()
