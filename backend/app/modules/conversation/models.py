from datetime import datetime
from typing import List, Optional

from sqlalchemy import BigInteger, ForeignKey, Integer, String, Text, TIMESTAMP, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# 确保 User 模型先被导入，使 users 表在 Base.metadata 中注册
from app.modules.auth.models import User  # noqa: F401

PK_TYPE = BigInteger().with_variant(Integer, "sqlite")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(PK_TYPE, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        PK_TYPE, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    scenario_id: Mapped[int] = mapped_column(
        PK_TYPE, ForeignKey("scenarios.id", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, nullable=True)

    messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.id",
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (CheckConstraint("role IN ('user', 'ai')", name="messages_role_check"),)

    id: Mapped[int] = mapped_column(PK_TYPE, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(
        PK_TYPE,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(10), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )

    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )
