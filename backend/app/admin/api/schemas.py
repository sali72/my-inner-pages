from typing import List
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
