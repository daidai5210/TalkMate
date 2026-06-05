"""Summary 路由:POST /conversations/:id/summary 生成,GET /conversations/:id/summary 获取。"""
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.modules.summary.models import Summary
from app.modules.summary.schemas import SummaryPublic
from app.modules.summary.service import SummaryService
from app.shared.exceptions import AuthError

router = APIRouter(prefix="/conversations", tags=["summary"])


def _current_user_id(authorization: str | None = Header(default=None)) -> int:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError(1004, "Token 无效或已过期")
    token = authorization.split(" ", 1)[1].strip()
    uid = decode_access_token(token)
    if uid is None:
        raise AuthError(1004, "Token 无效或已过期")
    return uid


@router.post(
    "/{conversation_id}/summary",
    response_model=None,
    status_code=status.HTTP_200_OK,
)
def generate_or_get_summary(
    conversation_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(_current_user_id),
):
    service = SummaryService(db)
    summary: Summary = service.get_or_generate(conversation_id, user_id)
    return {
        "code": 0,
        "message": "总结生成成功",
        "data": SummaryPublic.from_orm_with_json(summary).model_dump(mode="json"),
    }


@router.get(
    "/{conversation_id}/summary",
    response_model=None,
    status_code=status.HTTP_200_OK,
)
def get_summary(
    conversation_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(_current_user_id),
):
    service = SummaryService(db)
    summary = service.get_existing(conversation_id, user_id)
    return {
        "code": 0,
        "message": "success",
        "data": SummaryPublic.from_orm_with_json(summary).model_dump(mode="json"),
    }
