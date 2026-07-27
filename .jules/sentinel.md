## 2026-07-27 - Pre-Account Takeover via OAuth Linking
**Vulnerability:** An attacker could register an unverified account using a victim's email and a known password. If the victim later logged in via Google OAuth, the system linked the accounts and marked it verified, but retained the attacker's password.
**Learning:** Automatically linking an OAuth provider to an existing unverified account is a common pre-account takeover vector if existing local credentials aren't invalidated.
**Prevention:** Clear the existing local password (`hashed_password = None`) when linking a trusted OAuth provider to an *unverified* account.
