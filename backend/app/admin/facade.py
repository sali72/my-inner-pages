import asyncio
from datetime import datetime, timedelta, timezone
from typing import List

from app.admin.api.schemas import (
    AcquisitionStats,
    AdminStatsResponse,
    DailySignup,
    EngagementStats,
    SummaryStats,
)
from app.auth.db.models import User
from app.chat.db.models import Chat
from app.journals.db.models import Journal

PERIOD_DAYS_MAP = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
}


class AdminStatsFacade:
    """Facade for calculating operational analytics and metrics with dynamic periods."""

    async def get_stats(self, period: str = "14d") -> AdminStatsResponse:
        days = PERIOD_DAYS_MAP.get(period, 14)
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        d24h_ago = now - timedelta(days=1)
        d7d_ago = now - timedelta(days=7)
        d30d_ago = now - timedelta(days=30)

        current_period_start = now - timedelta(days=days)
        prev_period_start = now - timedelta(days=2 * days)

        # Execute independent queries concurrently via asyncio.gather
        (
            total_users,
            total_users_prev_period,
            active_users_period,
            active_users_prev_period,
            total_journals,
            total_journals_prev_period,
            total_chats,
            total_chats_prev_period,
            signups_today,
            signups_period,
            google_oauth_count,
            email_password_count,
            verified_count,
            unverified_stale_count,
            daily_signups_raw,
            wau,
            mau,
            returning_users,
            engaged_users_count,
            avg_journal_length,
        ) = await asyncio.gather(
            User.find().count(),
            User.find(User.created_at <= current_period_start).count(),
            User.find(User.last_login >= current_period_start).count(),
            User.find(
                User.last_login >= prev_period_start,
                User.last_login < current_period_start,
            ).count(),
            Journal.find().count(),
            Journal.find(Journal.created_at <= current_period_start).count(),
            Chat.find().count(),
            Chat.find(Chat.created_at <= current_period_start).count(),
            User.find(User.created_at >= today_start).count(),
            User.find(User.created_at >= current_period_start).count(),
            User.find(User.google_id != None).count(),  # noqa: E711
            User.find(User.google_id == None).count(),  # noqa: E711
            User.find(User.is_verified == True).count(),  # noqa: E712
            User.find(User.is_verified == False, User.created_at <= d24h_ago).count(),  # noqa: E712
            self._get_daily_signups(days, current_period_start, now),
            User.find(User.last_login >= d7d_ago).count(),
            User.find(User.last_login >= d30d_ago).count(),
            User.find(User.login_count > 1).count(),
            self._get_engaged_users_count(),
            self._get_avg_journal_length(),
        )

        dau = await User.find(User.last_login >= d24h_ago).count()
        stickiness = round(dau / mau, 2) if mau > 0 else 0.0
        return_rate = round(returning_users / total_users, 2) if total_users > 0 else 0.0

        active_user_base = mau if mau > 0 else (total_users if total_users > 0 else 1)
        avg_entries_per_active_user = round(total_journals / active_user_base, 1)

        summary = SummaryStats(
            total_users=total_users,
            total_users_prev_period=total_users_prev_period,
            active_users_period=active_users_period,
            active_users_prev_period=active_users_prev_period,
            total_journals=total_journals,
            total_journals_prev_period=total_journals_prev_period,
            total_chats=total_chats,
            total_chats_prev_period=total_chats_prev_period,
        )

        acquisition = AcquisitionStats(
            signups_today=signups_today,
            signups_period=signups_period,
            google_oauth_count=google_oauth_count,
            email_password_count=email_password_count,
            verified_count=verified_count,
            unverified_stale_count=unverified_stale_count,
            daily_signups=daily_signups_raw,
        )

        engagement = EngagementStats(
            wau=wau,
            mau=mau,
            stickiness=stickiness,
            returning_users=returning_users,
            return_rate=return_rate,
            engaged_users=engaged_users_count,
            avg_entries_per_active_user=avg_entries_per_active_user,
            avg_journal_length=avg_journal_length,
        )

        return AdminStatsResponse(
            period=period,
            period_days=days,
            summary=summary,
            acquisition=acquisition,
            engagement=engagement,
        )

    async def _get_daily_signups(
        self, days: int, start_date: datetime, end_date: datetime
    ) -> List[DailySignup]:
        """Aggregate daily signups for the selected period and pad missing days."""
        collection = User.get_motor_collection()
        pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        results = await collection.aggregate(pipeline).to_list(length=200)
        counts_by_date = {r["_id"]: r["count"] for r in results}

        daily_list: List[DailySignup] = []
        for i in range(days):
            day_dt = start_date + timedelta(days=i)
            day_str = day_dt.strftime("%Y-%m-%d")
            daily_list.append(DailySignup(date=day_str, count=counts_by_date.get(day_str, 0)))

        return daily_list

    async def _get_engaged_users_count(self) -> int:
        """Count users with 3 or more journal entries."""
        collection = Journal.get_motor_collection()
        pipeline = [
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gte": 3}}},
            {"$count": "engaged_count"},
        ]
        res = await collection.aggregate(pipeline).to_list(length=1)
        return res[0]["engaged_count"] if res else 0

    async def _get_avg_journal_length(self) -> int:
        """Calculate average character length of journal entries."""
        collection = Journal.get_motor_collection()
        pipeline = [
            {"$project": {"length": {"$strLenCP": "$content"}}},
            {"$group": {"_id": None, "avg_length": {"$avg": "$length"}}},
        ]
        res = await collection.aggregate(pipeline).to_list(length=1)
        return int(res[0]["avg_length"]) if res and res[0].get("avg_length") else 0
