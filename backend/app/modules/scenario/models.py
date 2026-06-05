from datetime import datetime

from sqlalchemy import BigInteger, Integer, String, Text, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

PK_TYPE = BigInteger().with_variant(Integer, "sqlite")


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(PK_TYPE, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
