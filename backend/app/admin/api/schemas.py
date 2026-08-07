from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class LifetimeStats(BaseModel):
    total_users: int
    total_journals: int
    total_chats: int
    verified_users: int


class SummaryStats(BaseModel):
    lifetime: LifetimeStats
    signups_current_period: int
    signups_prev_period: int
    active_users_period: int
    active_users_prev_period: int
    journals_current_period: int
    journals_prev_period: int
    chats_current_period: int
    chats_prev_period: int


class DailySignup(BaseModel):
    date: str
    count: int


class AcquisitionStats(BaseModel):
    signups_today: int
    signups_period: int
    google_oauth_count: int
    email_password_count: int
    verified_count: int
    unverified_stale_count: int
    daily_signups: List[DailySignup]


class EngagementStats(BaseModel):
    wau: int
    mau: int
    stickiness: float
    returning_users: int
    return_rate: float
    engaged_users: int
    avg_entries_per_active_user: float
    avg_journal_length: int


class AdminStatsResponse(BaseModel):
    period: str
    period_days: int
    summary: SummaryStats
    acquisition: AcquisitionStats
    engagement: EngagementStats


class UserItemSchema(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    auth_provider: str
    login_count: int
    journal_count: int
    chat_count: int
    created_at: datetime
    last_login: Optional[datetime] = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    users: List[UserItemSchema]
