from typing import Optional

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, get_current_user_id
from app.db.session import get_db
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
)
from app.modules.auth.service import AuthService
from app.shared.exceptions import AuthError
from app.shared.responses import ok

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> dict:
    service = AuthService(db)
    user = service.register(payload.username, payload.password, payload.captcha)
    return ok(data=user.model_dump(mode="json"), message="注册成功")


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> dict:
    service = AuthService(db)
    result: LoginResponse = service.login(payload.username, payload.password)
    return ok(data=result.model_dump(mode="json"), message="登录成功")


@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    user_id = get_current_user_id(authorization)
    repo = UserRepository(db)
    if repo.get_by_id(user_id) is None:
        raise AuthError(AuthService.ERR_TOKEN_INVALID, "Token 无效或已过期")
    return ok(message="登出成功")
