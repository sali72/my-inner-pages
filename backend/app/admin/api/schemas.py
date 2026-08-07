from typing import List
from pydantic import BaseModel


class SummaryStats(BaseModel):
    total_users: int
    total_users_prev_7d: int
    dau: int
    dau_prev_7d: int
    total_journals: int
    total_journals_prev_7d: int
    total_chats: int
    total_chats_prev_7d: int


class DailySignup(BaseModel):
    date: str
    count: int


class AcquisitionStats(BaseModel):
    signups_today: int
    signups_7d: int
    signups_30d: int
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
    summary: SummaryStats
    acquisition: AcquisitionStats
    engagement: EngagementStats
