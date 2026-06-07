"""User error profile data model.

Stores aggregated error counts by Chinese-learner error type per user,
with a sliding window of recent 5 conversations.
"""
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    TIMESTAMP,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# 确保 User 模型先被导入，使 users 表在 Base.metadata 中注册
from app.modules.auth.models import User  # noqa: F401

PK_TYPE = BigInteger().with_variant(Integer, "sqlite")

VALID_ERROR_TYPES = (
    "word_order",
    "tense",
    "article",
    "preposition",
    "direct_translation",
)


class UserErrorProfile(Base):
    __tablename__ = "user_error_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", "error_type", name="uq_user_error_type"),
        CheckConstraint(
            f"error_type IN {VALID_ERROR_TYPES}",
            name="ck_user_error_profiles_error_type",
        ),
    )

    id: Mapped[int] = mapped_column(PK_TYPE, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        PK_TYPE,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    error_type: Mapped[str] = mapped_column(String(30), nullable=False)
    total_count: Mapped[int] = mapped_column(Integer, default=0)
    recent_count: Mapped[int] = mapped_column(Integer, default=0)
    recent_conversation_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)
    last_updated: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp()
    )
