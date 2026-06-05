from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.modules.conversation.models import Conversation, Message
from app.modules.scenario.models import Scenario


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
