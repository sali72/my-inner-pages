import resend

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class EmailService:
    def __init__(self, settings: Settings):
        self.from_email = settings.from_email
        self.verification_url_base = settings.verification_url_base
        if settings.resend_api_key:
            resend.api_key = settings.resend_api_key

    def send_verification_email(self, to_email: str, token: str) -> None:
        verification_link = f"{self.verification_url_base}{token}"
        subject = "Verify your email — My Inner Pages"
        html = f"""
<p>Welcome to My Inner Pages!</p>
<p>Please verify your email address by clicking the link below:</p>
<p><a href="{verification_link}">Verify Email</a></p>
<p>This link expires in 24 hours.</p>
<p>If you did not create an account, you can ignore this email.</p>
"""
        try:
            params: resend.Emails.SendParams = {
                "from": self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
            }
            resend.Emails.send(params)
            logger.info("verification_email_sent", email=to_email)
        except Exception as e:
            logger.error("verification_email_failed", email=to_email, error=str(e))
