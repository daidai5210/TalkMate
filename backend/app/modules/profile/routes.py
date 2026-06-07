"""Profile API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.db.session import get_db
from app.modules.profile.service import ProfileService
from app.shared.responses import ok

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/error-summary")
def error_summary(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    service = ProfileService(db)
    data = service.get_error_summary(user_id)
    return ok(data=data)


@router.get("/next-goal")
def next_goal(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    service = ProfileService(db)
    data = service.get_next_goal(user_id)
    return ok(data=data)
