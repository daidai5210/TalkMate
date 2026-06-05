from datetime import datetime
from typing import List, NamedTuple, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.modules.conversation.models import Conversation, Message
from app.modules.scenario.models import Scenario
from app.modules.summary.models import Summary


class ConversationHistoryRow(NamedTuple):
    id: int
    scenario_id: int
    created_at: datetime
    finished_at: Optional[datetime]
    message_count: int
    summary_score: Optional[int]


class ConversationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, conversation_id: int) -> Optional[Conversation]:
        return (
            self.db.query(Conversation)
            .options(joinedload(Conversation.messages))
            .filter(Conversation.id == conversation_id, Conversation.deleted_at.is_(None))
            .first()
        )

    def create(self, user_id: int, scenario_id: int) -> Conversation:
        conv = Conversation(user_id=user_id, scenario_id=scenario_id)
        self.db.add(conv)
        self.db.commit()
        self.db.refresh(conv)
        return conv

    def list_by_user(self, user_id: int) -> List[ConversationHistoryRow]:
        rows = (
            self.db.query(
                Conversation.id,
                Conversation.scenario_id,
                Conversation.created_at,
                Conversation.finished_at,
                func.count(Message.id).label("message_count"),
                Summary.score.label("summary_score"),
            )
            .outerjoin(Message, Message.conversation_id == Conversation.id)
            .outerjoin(Summary, Summary.conversation_id == Conversation.id)
            .filter(Conversation.user_id == user_id, Conversation.deleted_at.is_(None))
            .group_by(
                Conversation.id,
                Conversation.scenario_id,
                Conversation.created_at,
                Conversation.finished_at,
                Summary.score,
            )
            .order_by(Conversation.created_at.desc(), Conversation.id.desc())
            .all()
        )
        return [ConversationHistoryRow(*row) for row in rows]


class MessageRepository:
    def __init__(self, db: Session):
        self.db = db

    def add(self, conversation_id: int, role: str, text: str) -> Message:
        msg = Message(conversation_id=conversation_id, role=role, text=text)
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

    def get_scenario(self, scenario_id: int) -> Optional[Scenario]:
        return self.db.query(Scenario).filter(Scenario.id == scenario_id).first()
