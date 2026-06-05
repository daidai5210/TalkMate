from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import LoginResponse, UserPublic
from app.shared.exceptions import AuthError, BusinessError


class AuthService:
    ERR_USERNAME_EXISTS = 1005
    ERR_CAPTCHA_INVALID = 1006
    ERR_USERNAME_NOT_FOUND = 1001
    ERR_PASSWORD_WRONG = 1002
    ERR_TOKEN_INVALID = 1004

    def __init__(self, db: Session):
        self.repo = UserRepository(db)
        self.settings = get_settings()

    def register(self, username: str, password: str, captcha: str) -> UserPublic:
        if captcha != self.settings.REGISTER_CAPTCHA:
            raise BusinessError(self.ERR_CAPTCHA_INVALID, "验证码错误")

        existing = self.repo.get_by_username(username, include_deleted=True)
        if existing is not None and existing.deleted_at is None:
            raise BusinessError(self.ERR_USERNAME_EXISTS, "用户名已存在")

        new_user = self.repo.create(
            username=username, password_hash=hash_password(password)
        )
        return UserPublic.model_validate(new_user)

    def login(self, username: str, password: str) -> LoginResponse:
        user = self.repo.get_by_username(username)
        if user is None:
            raise AuthError(self.ERR_USERNAME_NOT_FOUND, "用户名不存在")
        if not verify_password(password, user.password_hash):
            raise AuthError(self.ERR_PASSWORD_WRONG, "密码错误")

        token = create_access_token(user.id)
        return LoginResponse(token=token, user=UserPublic.model_validate(user))
