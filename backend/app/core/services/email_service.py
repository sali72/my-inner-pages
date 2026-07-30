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
        subject = "Welcome to My Inner Pages — verify your email"
        html = f"""<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f2ed;font-family:Georgia,'Times New Roman',serif;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="480" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);padding:48px 40px;">
        <tr>
          <td style="padding-bottom:8px;text-align:center;">
            <span style="font-size:28px;font-weight:700;color:#b45309;letter-spacing:-0.5px;">My Inner Pages</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:28px;text-align:center;border-bottom:1px solid #e8e2d8;">
            <span style="font-size:14px;color:#8b7f72;">your private journaling space</span>
          </td>
        </tr>
        <tr>
          <td style="padding-top:28px;">
            <p style="margin:0 0 16px;font-size:16px;color:#3d352a;line-height:1.7;">Hello,</p>
            <p style="margin:0 0 16px;font-size:16px;color:#3d352a;line-height:1.7;">
              You're one step away from a quiet place that's all yours.
            </p>
            <p style="margin:0 0 24px;font-size:16px;color:#3d352a;line-height:1.7;">
              Click the button below to verify your email and unlock your private journal:
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding:0 0 24px;">
                  <a href="{verification_link}" style="display:inline-block;padding:14px 36px;background:#b45309;color:#ffffff;font-size:15px;font-family:Georgia,'Times New Roman',serif;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                    Verify Email
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:14px;color:#8b7f72;line-height:1.6;">
              This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:20px;border-top:1px solid #e8e2d8;text-align:center;">
            <p style="margin:0;font-size:13px;color:#a39688;font-style:italic;">
              My Inner Pages — a space for your thoughts to unfold
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>"""
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
