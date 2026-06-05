from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app.modules.auth.models import User  # noqa: F401
    from app.modules.conversation.models import Conversation, Message  # noqa: F401
    from app.modules.scenario.models import Scenario  # noqa: F401

    Base.metadata.create_all(bind=engine)
