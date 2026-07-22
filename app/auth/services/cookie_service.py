from datetime import timedelta
from fastapi import Response

from app.core.config import Settings


class CookieService:
    """Manage HttpOnly auth cookies and non-HttpOnly session indicator.

    The actual JWT is stored in an HttpOnly cookie (inaccessible to JS).
    A separate non-HttpOnly ``session_exists`` cookie lets the frontend
    synchronously check whether a session *may* exist without calling
    ``/auth/verify`` on every page load.
    """

    def __init__(self, settings: Settings):
        self.secure = settings.is_production
        self.samesite = "lax"
        self.api_path = "/api/v0"
        self.root_path = "/"
        self.max_age_seconds = int(timedelta(hours=24).total_seconds())

    # ------------------------------------------------------------------
    # Auth cookie (HttpOnly — contains the real JWT)
    # ------------------------------------------------------------------

    def set_auth_cookie(
        self, response: Response, token: str, max_age: int | None = None
    ) -> None:
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=self.secure,
            samesite=self.samesite,
            max_age=max_age or self.max_age_seconds,
            path=self.api_path,
        )

    def clear_auth_cookie(self, response: Response) -> None:
        response.delete_cookie(key="access_token", path=self.api_path)

    # ------------------------------------------------------------------
    # Session indicator (non-HttpOnly — JS can read it)
    # ------------------------------------------------------------------

    def set_session_cookie(self, response: Response) -> None:
        response.set_cookie(
            key="session_exists",
            value="1",
            httponly=False,
            secure=self.secure,
            samesite=self.samesite,
            max_age=self.max_age_seconds,
            path=self.root_path,
        )

    def clear_session_cookie(self, response: Response) -> None:
        response.delete_cookie(key="session_exists", path=self.root_path)
