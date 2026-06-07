"""Profile data access."""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.profile.models import UserErrorProfile, VALID_ERROR_TYPES


class ProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create(self, user_id: int, error_type: str) -> UserErrorProfile:
        profile = (
            self.db.query(UserErrorProfile)
            .filter(
                UserErrorProfile.user_id == user_id,
                UserErrorProfile.error_type == error_type,
            )
            .one_or_none()
        )
        if profile is not None:
            return profile
        profile = UserErrorProfile(
            user_id=user_id,
            error_type=error_type,
            total_count=0,
            recent_count=0,
            recent_conversation_ids=[],
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_all_for_user(self, user_id: int) -> list[UserErrorProfile]:
        result = []
        for et in VALID_ERROR_TYPES:
            profile = self.get_or_create(user_id, et)
            result.append(profile)
        return result

    def update_counts(
        self,
        user_id: int,
        error_type: str,
        count_delta: int,
        conversation_id: int,
        max_window: int = 5,
    ) -> UserErrorProfile:
        profile = self.get_or_create(user_id, error_type)
        profile.total_count = max(0, profile.total_count + count_delta)

        items: list[dict] = profile.recent_conversation_ids or []
        items = [item for item in items if item.get("id") != conversation_id]
        items.insert(0, {"id": conversation_id, "count": count_delta})
        items = items[:max_window]
        profile.recent_conversation_ids = items
        profile.recent_count = sum(int(item.get("count", 0)) for item in items)

        profile.last_updated = datetime.utcnow()
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def remove_conversation(self, conversation_id: int) -> None:
        profiles = (
            self.db.query(UserErrorProfile)
            .filter(UserErrorProfile.recent_conversation_ids.isnot(None))
            .all()
        )
        for profile in profiles:
            items: list[dict] = profile.recent_conversation_ids or []
            next_items = [item for item in items if item.get("id") != conversation_id]
            if len(next_items) != len(items):
                profile.recent_conversation_ids = next_items
                profile.recent_count = sum(int(item.get("count", 0)) for item in next_items)
                profile.last_updated = datetime.utcnow()
        self.db.commit()
