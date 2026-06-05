from typing import Optional

from sqlalchemy.orm import Session

from app.modules.auth.repository import UserRepository
from app.modules.conversation.models import Message
from app.modules.conversation.repository import ConversationRepository, MessageRepository
from app.modules.conversation.schemas import (
    ConversationPublic,
    MessagePublic,
    ScenarioSummary,
    SendMessageResponse,
)
from app.modules.scenario.repository import ScenarioRepository
from app.shared.exceptions import BusinessError

FIXED_AI_REPLY = (
    "收到你的消息!这是占位回复,AI 集成将在 T-004 接入 DeepSeek API。"
)


class ConversationService:
    ERR_CONVERSATION_NOT_FOUND = 3001
    ERR_SCENARIO_NOT_FOUND = 2001

    def __init__(self, db: Session):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)
        self.scenario_repo = ScenarioRepository(db)

    def create(self, user_id: int, scenario_id: int) -> ConversationPublic:
        if self.scenario_repo.list_ordered() is None:
            pass  # not used; we just check existence
        scenario = self.scenario_repo.list_ordered()
        # Verify scenario exists
        from app.modules.conversation.repository import MessageRepository as _MR

        scen = _MR(self.db).get_scenario(scenario_id)
        if scen is None:
            raise BusinessError(self.ERR_SCENARIO_NOT_FOUND, "场景不存在")

        conv = self.conv_repo.create(user_id=user_id, scenario_id=scenario_id)
        return self._to_public(conv)

    def get(self, conversation_id: int) -> ConversationPublic:
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv is None:
            raise BusinessError(self.ERR_CONVERSATION_NOT_FOUND, "对话不存在")
        return self._to_public(conv)

    def send_message(self, conversation_id: int, text: str) -> SendMessageResponse:
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv is None:
            raise BusinessError(self.ERR_CONVERSATION_NOT_FOUND, "对话不存在")

        user_msg = self.msg_repo.add(conversation_id=conversation_id, role="user", text=text)
        ai_msg = self.msg_repo.add(
            conversation_id=conversation_id, role="ai", text=FIXED_AI_REPLY
        )
        return SendMessageResponse(
            user_message=MessagePublic.model_validate(user_msg),
            ai_message=MessagePublic.model_validate(ai_msg),
        )

    def _to_public(self, conv) -> ConversationPublic:
        scenario = self.scenario_repo.list_ordered()
        scen = next((s for s in scenario if s.id == conv.scenario_id), None)
        if scen is None:
            raise BusinessError(self.ERR_SCENARIO_NOT_FOUND, "关联场景不存在")
        return ConversationPublic(
            id=conv.id,
            scenario=ScenarioSummary(
                id=scen.id, name=scen.name, icon=scen.icon
            ),
            created_at=conv.created_at,
            finished_at=conv.finished_at,
            messages=[MessagePublic.model_validate(m) for m in conv.messages],
        )
