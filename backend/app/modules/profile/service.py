"""Profile business logic."""
import json
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.profile.repository import ProfileRepository
from app.modules.profile.models import VALID_ERROR_TYPES

logger = logging.getLogger(__name__)

ERROR_TYPE_TO_SCENARIO: dict[str, int] = {
    "word_order": 1,
    "tense": 3,
    "article": 5,
    "preposition": 4,
    "direct_translation": 5,
}

ERROR_TYPE_LABELS: dict[str, str] = {
    "word_order": "中式语序",
    "tense": "时态",
    "article": "冠词",
    "preposition": "介词",
    "direct_translation": "直译表达",
}

SCENARIO_NAMES: dict[int, str] = {
    1: "面试",
    2: "点餐",
    3: "会议",
    4: "旅行",
    5: "日常",
}


class ProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProfileRepository(db)

    def update_from_summary(
        self, user_id: int, conversation_id: int, error_profile: dict[str, int]
    ) -> None:
        for error_type in VALID_ERROR_TYPES:
            count = error_profile.get(error_type, 0)
            self.repo.update_counts(
                user_id=user_id,
                error_type=error_type,
                count_delta=max(0, int(count)),
                conversation_id=conversation_id,
            )
        logger.info(
            "profile updated user_id=%d conversation_id=%d types=%s",
            user_id,
            conversation_id,
            error_profile,
        )

    def get_error_summary(self, user_id: int) -> dict[str, Any]:
        profiles = self.repo.get_all_for_user(user_id)
        total_conversations = max(
            (len(p.recent_conversation_ids or []) for p in profiles), default=0
        )
        has_enough = any(
            (p.recent_conversation_ids and len(p.recent_conversation_ids) >= 5)
            for p in profiles
        )

        items = []
        for p in profiles:
            items.append({
                "error_type": p.error_type,
                "label": ERROR_TYPE_LABELS.get(p.error_type, p.error_type),
                "total_count": p.total_count,
                "recent_count": p.recent_count,
            })

        return {
            "total_conversations": total_conversations,
            "window_size": 5,
            "profiles": items,
            "has_enough_data": has_enough,
        }

    def get_next_goal(self, user_id: int) -> dict[str, Any]:
        profiles = self.repo.get_all_for_user(user_id)
        has_enough = any(
            (p.recent_conversation_ids and len(p.recent_conversation_ids) >= 5)
            for p in profiles
        )

        if not has_enough:
            return {
                "has_enough_data": False,
                "hint": "完成 5 次练习后解锁你的中式英语画像",
            }

        top = max(profiles, key=lambda p: (p.recent_count, p.total_count))
        if top.recent_count <= 0:
            return {
                "has_enough_data": True,
                "hint": "目前没有明显的中式英语倾向，继续加油",
            }
        scenario_id = ERROR_TYPE_TO_SCENARIO.get(
            top.error_type, 5
        )
        scenario_name = SCENARIO_NAMES.get(scenario_id, "日常")

        return {
            "has_enough_data": True,
            "recommended_scenario_id": scenario_id,
            "recommended_scenario_name": scenario_name,
            "focus_error_type": top.error_type,
            "focus_error_label": ERROR_TYPE_LABELS.get(top.error_type, top.error_type),
            "reason": f"最近 5 次练习中，{ERROR_TYPE_LABELS.get(top.error_type, top.error_type)}问题出现 {top.recent_count} 次，是最常见的错误类型",
        }

    def remove_from_window(self, conversation_id: int) -> None:
        self.repo.remove_conversation(conversation_id)
