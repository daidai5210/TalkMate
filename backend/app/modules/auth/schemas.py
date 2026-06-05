import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,50}$")


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=32)
    captcha: str = Field(..., min_length=4, max_length=4)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not USERNAME_RE.match(v):
            raise ValueError("用户名仅允许字母、数字、下划线,长度 3-50")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if v.isdigit() or v.isalpha():
            raise ValueError("密码必须包含字母和数字")
        return v


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=32)


class UserPublic(BaseModel):
    id: int
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    token: str
    user: UserPublic
