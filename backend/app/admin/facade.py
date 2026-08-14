import asyncio
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.admin.api.schemas import (
    AcquisitionStats,
    AdminStatsResponse,
    DailySignup,
    EngagementStats,
    LifetimeStats,
    SummaryStats,
    UserItemSchema,
    UserListResponse,
)
from app.auth.db.models import RefreshToken, User
from app.chat.db.models import Chat
from app.core.validators import validate_object_id
from app.journals.db.models import Journal

PERIOD_DAYS_MAP = {
    "7d": 7,
    "14d": 14,
    "30d": 30,
    "90d": 90,
}


class AdminStatsFacade:
    """Facade for calculating operational analytics, metrics, and user management."""

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
            signups_current_period,
            signups_prev_period,
            active_users_period,
            active_users_prev_period,
            total_journals,
            journals_current_period,
            journals_prev_period,
            total_chats,
            chats_current_period,
            chats_prev_period,
            signups_today,
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
            User.find(User.created_at >= current_period_start).count(),
            User.find(
                User.created_at >= prev_period_start,
                User.created_at < current_period_start,
            ).count(),
            User.find(User.last_login >= current_period_start).count(),
            User.find(
                User.last_login >= prev_period_start,
                User.last_login < current_period_start,
            ).count(),
            Journal.find().count(),
            Journal.find(Journal.created_at >= current_period_start).count(),
            Journal.find(
                Journal.created_at >= prev_period_start,
                Journal.created_at < current_period_start,
            ).count(),
            Chat.find().count(),
            Chat.find(Chat.created_at >= current_period_start).count(),
            Chat.find(
                Chat.created_at >= prev_period_start,
                Chat.created_at < current_period_start,
            ).count(),
            User.find(User.created_at >= today_start).count(),
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

        avg_entries_per_active_user = (
            round(journals_current_period / active_users_period, 1)
            if active_users_period > 0
            else 0.0
        )

        lifetime = LifetimeStats(
            total_users=total_users,
            total_journals=total_journals,
            total_chats=total_chats,
            verified_users=verified_count,
        )

        summary = SummaryStats(
            lifetime=lifetime,
            signups_current_period=signups_current_period,
            signups_prev_period=signups_prev_period,
            active_users_period=active_users_period,
            active_users_prev_period=active_users_prev_period,
            journals_current_period=journals_current_period,
            journals_prev_period=journals_prev_period,
            chats_current_period=chats_current_period,
            chats_prev_period=chats_prev_period,
        )

        acquisition = AcquisitionStats(
            signups_today=signups_today,
            signups_period=signups_current_period,
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

    async def get_users_list(
        self, skip: int = 0, limit: int = 50, search: Optional[str] = None
    ) -> UserListResponse:
        """Fetch paginated registered users with email search and per-user activity metrics."""
        query = {}
        if search and search.strip():
            query["email"] = {"$regex": search.strip(), "$options": "i"}

        collection_users = User.get_motor_collection()
        collection_journals = Journal.get_motor_collection()
        collection_chats = Chat.get_motor_collection()

        total = await collection_users.count_documents(query)
        cursor = collection_users.find(query).sort("created_at", -1).skip(skip).limit(limit)
        users_raw = await cursor.to_list(length=limit)

        user_ids = [str(u["_id"]) for u in users_raw]

        # Concurrently fetch activity counts for users on this page
        j_pipeline = [
            {"$match": {"user_id": {"$in": user_ids}}},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        ]
        c_pipeline = [
            {"$match": {"user_id": {"$in": user_ids}}},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        ]

        j_results, c_results = await asyncio.gather(
            collection_journals.aggregate(j_pipeline).to_list(length=len(user_ids)),
            collection_chats.aggregate(c_pipeline).to_list(length=len(user_ids)),
        )

        j_map = {r["_id"]: r["count"] for r in j_results}
        c_map = {r["_id"]: r["count"] for r in c_results}

        user_items = [
            UserItemSchema(
                id=str(u["_id"]),
                email=u.get("email", ""),
                role=u.get("role", "user"),
                is_active=u.get("is_active", True),
                is_verified=u.get("is_verified", False),
                auth_provider="google" if u.get("google_id") else "email",
                login_count=u.get("login_count", 0),
                journal_count=j_map.get(str(u["_id"]), 0),
                chat_count=c_map.get(str(u["_id"]), 0),
                created_at=u.get("created_at"),
                last_login=u.get("last_login"),
            )
            for u in users_raw
        ]

        return UserListResponse(total=total, skip=skip, limit=limit, users=user_items)

    async def update_user_status(
        self, target_user_id: str, is_active: bool, admin_user: User
    ) -> UserItemSchema:
        """Update user activation status with security guardrails."""
        if str(admin_user.id) == str(target_user_id):
            raise ValueError("You cannot change the status of your own admin account")

        obj_id = validate_object_id(target_user_id, field_name="user_id")
        user = await User.get(obj_id)
        if not user:
            raise KeyError("User not found")

        user.is_active = is_active
        await user.save()

        # If deactivating, instantly revoke all active session tokens
        if not is_active:
            await RefreshToken.find(RefreshToken.user_id == user.id).update(
                {"$set": {"is_revoked": True}}
            )

        collection_journals = Journal.get_motor_collection()
        collection_chats = Chat.get_motor_collection()
        j_count = await collection_journals.count_documents({"user_id": str(user.id)})
        c_count = await collection_chats.count_documents({"user_id": str(user.id)})

        return UserItemSchema(
            id=str(user.id),
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            auth_provider="google" if user.google_id else "email",
            login_count=user.login_count,
            journal_count=j_count,
            chat_count=c_count,
            created_at=user.created_at,
            last_login=user.last_login,
        )

    async def delete_user(self, target_user_id: str, admin_user: User) -> None:
        """Cascading delete of user, journals, chats, and sessions with security guardrails."""
        if str(admin_user.id) == str(target_user_id):
            raise ValueError("You cannot delete your own admin account")

        obj_id = validate_object_id(target_user_id, field_name="user_id")
        user = await User.get(obj_id)
        if not user:
            raise KeyError("User not found")

        # Cascading deletion across all collections for this user
        await asyncio.gather(
            RefreshToken.find(RefreshToken.user_id == user.id).delete(),
            Journal.find(Journal.user_id == str(user.id)).delete(),
            Chat.find(Chat.user_id == str(user.id)).delete(),
        )

        await user.delete()

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
            {"$project": {"length": {"$strLenCP": {"$ifNull": ["$content_text", ""]}}}},
            {"$group": {"_id": None, "avg_length": {"$avg": "$length"}}},
        ]
        res = await collection.aggregate(pipeline).to_list(length=1)
        return int(res[0]["avg_length"]) if res and res[0].get("avg_length") else 0
