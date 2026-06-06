"""Practice service: card management, AI-based evaluation, achievement checking."""
import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.modules.ai_service.client import DeepSeekClient
from app.modules.ai_service.exceptions import (
    AIRateLimitError,
    AITimeoutError,
    AIUnavailableError,
)
from app.modules.practice import repository as repo
from app.modules.practice.schemas import (
    AchievementOut,
    EvaluateOut,
    PracticeCardOut,
    PracticeRecordOut,
)
from app.shared.exceptions import BusinessError

logger = logging.getLogger(__name__)

ACHIEVEMENT_DEFINITIONS: List[dict] = [
    {"key": "first_practice", "label": "初次尝试", "description": "完成第一次口语练习", "icon": "🎤"},
    {"key": "streak_3", "label": "三天坚持", "description": "连续 3 天完成练习", "icon": "🔥"},
    {"key": "streak_7", "label": "周冠军", "description": "连续 7 天完成练习", "icon": "🏆"},
    {"key": "perfect_score", "label": "满分达人", "description": "获得一次满分评价", "icon": "⭐"},
    {"key": "all_scenarios", "label": "场景全通", "description": "完成所有场景的练习", "icon": "🗺️"},
    {"key": "voice_master", "label": "朗读新手", "description": "完成 10 次语音输入", "icon": "🎙️"},
]

EVALUATE_PROMPT = """You are a professional English pronunciation and speaking coach.
Evaluate the learner's spoken sentence based on the reference content.

Reference sentence: "{reference}"
Learner's spoken text: "{spoken}"

Provide a JSON object with these fields:
- "score": integer 0-100 (overall speaking score considering accuracy, fluency, and pronunciation)
- "pronunciation": integer 0-100 (pronunciation accuracy)
- "grammar": integer 0-100 (grammatical correctness compared to reference)
- "fluency": integer 0-100 (naturalness and fluency of expression)
- "feedback": string (1-2 sentences of constructive feedback in Chinese, pointing out specific issues and how to improve)

Output ONLY a JSON object, no markdown code fences, no commentary."""


def get_random_card(db: Session, exclude_ids: Optional[List[int]] = None) -> Optional[PracticeCardOut]:
    card = repo.get_random_card(db, exclude_ids)
    if card is None:
        return None
    return PracticeCardOut.model_validate(card)


def evaluate_card(db: Session, user_id: int, card_id: int, text: str) -> EvaluateOut:
    card = repo.get_card_by_id(db, card_id)
    if card is None:
        raise BusinessError(code=4004, message="卡片不存在")

    client = DeepSeekClient()
    prompt = EVALUATE_PROMPT.format(reference=card.content, spoken=text)
    messages = [{"role": "user", "content": prompt}]

    try:
        response = client.chat(messages)
        result = json.loads(response)
    except AITimeoutError:
        raise BusinessError(code=5002, message="AI 评分超时，请稍后重试")
    except AIRateLimitError:
        raise BusinessError(code=5003, message="AI 评分频率超限，请稍候再试")
    except AIUnavailableError:
        raise BusinessError(code=5004, message="AI 服务暂不可用")
    except json.JSONDecodeError:
        logger.warning("practice.evaluate invalid json from AI")
        raise BusinessError(code=5005, message="AI 评分结果解析失败")
    except Exception:
        logger.exception("practice.evaluate unexpected error")
        raise BusinessError(code=5006, message="AI 评分异常")

    score = max(0, min(100, int(result.get("score", 0))))
    pronunciation = max(0, min(100, int(result.get("pronunciation", 0)))) if "pronunciation" in result else None
    grammar = max(0, min(100, int(result.get("grammar", 0)))) if "grammar" in result else None
    fluency = max(0, min(100, int(result.get("fluency", 0)))) if "fluency" in result else None
    feedback = result.get("feedback")

    record = repo.create_record(
        db, user_id=user_id, card_id=card_id,
        score=score, pronunciation=pronunciation,
        grammar=grammar, fluency=fluency, feedback=feedback,
    )

    check_and_unlock_achievements(db, user_id)

    return EvaluateOut(
        id=record.id,
        score=record.score,
        pronunciation=record.pronunciation,
        grammar=record.grammar,
        fluency=record.fluency,
        feedback=record.feedback,
        created_at=record.created_at,
    )


def get_user_records(db: Session, user_id: int, limit: int = 20) -> List[PracticeRecordOut]:
    records = repo.get_user_records(db, user_id, limit)
    result: List[PracticeRecordOut] = []
    for r in records:
        out = PracticeRecordOut(
            id=r.id,
            card_id=r.card_id,
            score=r.score,
            pronunciation=r.pronunciation,
            grammar=r.grammar,
            fluency=r.fluency,
            feedback=r.feedback,
            created_at=r.created_at,
            card=None,
        )
        if r.card_id:
            card = repo.get_card_by_id(db, r.card_id)
            if card:
                out.card = PracticeCardOut.model_validate(card)
        result.append(out)
    return result


def get_user_achievements(db: Session, user_id: int) -> List[AchievementOut]:
    unlocked = repo.get_user_achievements(db, user_id)
    unlocked_keys = {a.achievement_key for a in unlocked}
    unlocked_map = {a.achievement_key: a for a in unlocked}
    result: List[AchievementOut] = []
    for defn in ACHIEVEMENT_DEFINITIONS:
        key = defn["key"]
        is_unlocked = key in unlocked_keys
        result.append(AchievementOut(
            key=key,
            label=defn["label"],
            description=defn["description"],
            icon=defn["icon"],
            unlocked=is_unlocked,
            unlocked_at=unlocked_map[key].unlocked_at.isoformat() if is_unlocked else None,
        ))
    return result


def check_and_unlock_achievements(db: Session, user_id: int) -> List[str]:
    newly_unlocked: List[str] = []

    total_practices = repo.count_user_total_practices(db, user_id)
    if total_practices >= 1:
        if repo.unlock_achievement(db, user_id, "first_practice"):
            newly_unlocked.append("first_practice")

    if total_practices >= 10:
        if repo.unlock_achievement(db, user_id, "voice_master"):
            newly_unlocked.append("voice_master")

    practice_days = repo.count_user_practice_days(db, user_id)
    if practice_days >= 3:
        if repo.unlock_achievement(db, user_id, "streak_3"):
            newly_unlocked.append("streak_3")
    if practice_days >= 7:
        if repo.unlock_achievement(db, user_id, "streak_7"):
            newly_unlocked.append("streak_7")

    perfect = repo.get_user_perfect_scores(db, user_id)
    if perfect > 0:
        if repo.unlock_achievement(db, user_id, "perfect_score"):
            newly_unlocked.append("perfect_score")

    unique_scenarios = repo.count_unique_scenarios_practiced(db, user_id)
    if unique_scenarios >= 5:
        if repo.unlock_achievement(db, user_id, "all_scenarios"):
            newly_unlocked.append("all_scenarios")

    return newly_unlocked
