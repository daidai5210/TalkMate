from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.db.url import build_engine_kwargs

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    **build_engine_kwargs(settings.DATABASE_URL),
)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app.modules.auth.models import User  # noqa: F401
    from app.modules.conversation.models import Conversation, Message  # noqa: F401
    from app.modules.scenario.models import Scenario  # noqa: F401
    from app.modules.summary.models import Summary  # noqa: F401
    from app.modules.practice.models import PracticeCard, PracticeRecord, UserAchievement  # noqa: F401

    Base.metadata.create_all(bind=engine)
