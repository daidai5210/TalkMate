"""Summary 数据模型:对话结束后生成的纠错反馈 + 课后总结。"""
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    ForeignKey,
    Integer,
    Text,
    TIMESTAMP,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.modules.conversation.models import Conversation

PK_TYPE = BigInteger().with_variant(Integer, "sqlite")


class Summary(Base):
    __tablename__ = "summaries"
    __table_args__ = (
        UniqueConstraint("conversation_id", name="uq_summaries_conversation_id"),
        CheckConstraint("score >= 0 AND score <= 100", name="ck_summaries_score"),
    )

    id: Mapped[int] = mapped_column(PK_TYPE, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(
        PK_TYPE,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    suggestions: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    grammar_issues: Mapped[str | None] = mapped_column(Text, nullable=True)
    vocabulary_usage: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )

    conversation = relationship("Conversation", backref="summary")
