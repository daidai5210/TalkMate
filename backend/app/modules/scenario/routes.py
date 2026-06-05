from typing import List, Optional

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.modules.scenario.schemas import ScenarioPublic
from app.modules.scenario.service import ScenarioService
from app.shared.exceptions import AuthError
from app.shared.responses import ok

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _require_user_id(authorization: Optional[str] = Header(default=None)) -> int:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError(1004, "未提供有效 token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_access_token(token)
    if user_id is None:
        raise AuthError(1004, "Token 无效或已过期")
    return user_id


@router.get("", response_model=None)
def list_scenarios(
    _: int = Depends(_require_user_id),
    db: Session = Depends(get_db),
) -> dict:
    service = ScenarioService(db)
    scenarios: List[ScenarioPublic] = service.list_scenarios()
    return ok(data=[s.model_dump(mode="json") for s in scenarios])
