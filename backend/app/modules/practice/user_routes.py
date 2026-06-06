"""User stats routes: heatmap and score trend data."""
from datetime import date, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func, cast, Date

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.modules.conversation.models import Conversation
from app.modules.practice.models import PracticeRecord
from app.modules.summary.models import Summary
from app.shared.responses import ok

router = APIRouter(prefix="/user", tags=["user-stats"])


@router.get("/heatmap")
def get_heatmap(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
    days: int = Query(default=90, ge=1, le=365),
):
    cutoff = date.today() - timedelta(days=days - 1)

    conv_days = (
        db.query(cast(Conversation.created_at, Date).label("day"), sa_func.count().label("count"))
        .filter(Conversation.user_id == user_id, cast(Conversation.created_at, Date) >= cutoff)
        .group_by("day")
        .all()
    )
    practice_days = (
        db.query(cast(PracticeRecord.created_at, Date).label("day"), sa_func.count().label("count"))
        .filter(PracticeRecord.user_id == user_id, cast(PracticeRecord.created_at, Date) >= cutoff)
        .group_by("day")
        .all()
    )

    date_map: dict[str, int] = {}
    for row in conv_days:
        date_map[str(row.day)] = date_map.get(str(row.day), 0) + row.count
    for row in practice_days:
        date_map[str(row.day)] = date_map.get(str(row.day), 0) + row.count

    result: List[dict] = []
    for i in range(days):
        d = cutoff + timedelta(days=i)
        ds = d.isoformat()
        result.append({"date": ds, "count": date_map.get(ds, 0)})

    return ok(data=result)


@router.get("/score-trend")
def get_score_trend(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
    days: int = Query(default=30, ge=7, le=365),
):
    cutoff = date.today() - timedelta(days=days - 1)

    conv_scores = (
        db.query(Summary.score, cast(Summary.created_at, Date).label("day"))
        .join(Conversation, Summary.conversation_id == Conversation.id)
        .filter(Conversation.user_id == user_id, cast(Summary.created_at, Date) >= cutoff)
        .all()
    )
    practice_scores = (
        db.query(PracticeRecord.score, cast(PracticeRecord.created_at, Date).label("day"))
        .filter(PracticeRecord.user_id == user_id, cast(PracticeRecord.created_at, Date) >= cutoff)
        .all()
    )

    result: List[dict] = []
    for score, d in conv_scores:
        result.append({"date": str(d), "score": score, "type": "conversation"})
    for score, d in practice_scores:
        result.append({"date": str(d), "score": score, "type": "card"})

    result.sort(key=lambda x: x["date"])
    return ok(data=result)
