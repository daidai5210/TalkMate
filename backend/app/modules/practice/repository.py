"""Practice module repository."""
import random
from typing import List, Optional

from sqlalchemy.orm import Session

from app.modules.practice.models import PracticeCard, PracticeRecord, UserAchievement


def get_random_card(db: Session, exclude_ids: Optional[List[int]] = None) -> Optional[PracticeCard]:
    query = db.query(PracticeCard)
    if exclude_ids:
        query = query.filter(PracticeCard.id.notin_(exclude_ids))
    count = query.count()
    if count == 0:
        return None
    offset = random.randint(0, count - 1)
    return query.offset(offset).first()


def get_card_by_id(db: Session, card_id: int) -> Optional[PracticeCard]:
    return db.query(PracticeCard).filter(PracticeCard.id == card_id).first()


def create_record(db: Session, user_id: int, card_id: int, score: int,
                  pronunciation: Optional[int] = None,
                  grammar: Optional[int] = None,
                  fluency: Optional[int] = None,
                  feedback: Optional[str] = None) -> PracticeRecord:
    record = PracticeRecord(
        user_id=user_id,
        card_id=card_id,
        score=score,
        pronunciation=pronunciation,
        grammar=grammar,
        fluency=fluency,
        feedback=feedback,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_user_records(db: Session, user_id: int, limit: int = 20) -> List[PracticeRecord]:
    return (
        db.query(PracticeRecord)
        .filter(PracticeRecord.user_id == user_id)
        .order_by(PracticeRecord.created_at.desc())
        .limit(limit)
        .all()
    )


def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    return (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == user_id)
        .all()
    )


def unlock_achievement(db: Session, user_id: int, achievement_key: str) -> Optional[UserAchievement]:
    existing = (
        db.query(UserAchievement)
        .filter(UserAchievement.user_id == user_id, UserAchievement.achievement_key == achievement_key)
        .first()
    )
    if existing:
        return None
    achievement = UserAchievement(user_id=user_id, achievement_key=achievement_key)
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    return achievement


def count_user_practice_days(db: Session, user_id: int) -> int:
    from datetime import date
    from sqlalchemy import func as sa_func, cast, Date
    days = (
        db.query(sa_func.count(sa_func.distinct(cast(PracticeRecord.created_at, Date))))
        .filter(PracticeRecord.user_id == user_id)
        .scalar()
    )
    return days or 0


def count_user_conversation_days(db: Session, user_id: int) -> int:
    from datetime import date
    from sqlalchemy import func as sa_func, cast, Date
    from app.modules.conversation.models import Conversation
    days = (
        db.query(sa_func.count(sa_func.distinct(cast(Conversation.created_at, Date))))
        .filter(Conversation.user_id == user_id)
        .scalar()
    )
    return days or 0


def count_user_total_practices(db: Session, user_id: int) -> int:
    return (
        db.query(PracticeRecord)
        .filter(PracticeRecord.user_id == user_id)
        .count()
    )


def get_user_perfect_scores(db: Session, user_id: int) -> int:
    return (
        db.query(PracticeRecord)
        .filter(PracticeRecord.user_id == user_id, PracticeRecord.score == 100)
        .count()
    )


def count_unique_scenarios_practiced(db: Session, user_id: int) -> int:
    from sqlalchemy import func as sa_func
    count = (
        db.query(sa_func.count(sa_func.distinct(PracticeCard.scenario)))
        .join(PracticeRecord, PracticeRecord.card_id == PracticeCard.id)
        .filter(PracticeRecord.user_id == user_id)
        .scalar()
    )
    return count or 0
