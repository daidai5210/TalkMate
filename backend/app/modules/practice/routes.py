"""Practice module API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.practice import service
from app.modules.practice.schemas import EvaluateRequest
from app.shared.responses import err, ok
from app.core.security import get_current_user_id

router = APIRouter(prefix="/practice-cards", tags=["practice"])


@router.get("/random")
def random_card(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    card = service.get_random_card(db)
    if card is None:
        return ok(data=None, message="暂无可用卡片")
    return ok(data=card.model_dump())


@router.post("/{card_id}/evaluate")
def evaluate_card(
    card_id: int,
    body: EvaluateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    result = service.evaluate_card(db, user_id=user_id, card_id=card_id, text=body.text)
    return ok(data=result.model_dump())


@router.get("/records")
def list_records(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    records = service.get_user_records(db, user_id)
    return ok(data=[r.model_dump() for r in records])


@router.get("/achievements")
def list_achievements(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    achievements = service.get_user_achievements(db, user_id)
    return ok(data=[a.model_dump() for a in achievements])
