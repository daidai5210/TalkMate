from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class CreateConversationRequest(BaseModel):
    scenario_id: int = Field(..., gt=0)


class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class MessagePublic(BaseModel):
    id: int
    role: Literal["user", "ai"]
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ScenarioSummary(BaseModel):
    id: int
    name: str
    icon: str

    model_config = {"from_attributes": True}


class ConversationPublic(BaseModel):
    id: int
    scenario: ScenarioSummary
    created_at: datetime
    finished_at: Optional[datetime] = None
    messages: List[MessagePublic] = []

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    id: int
    scenario_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationHistoryItem(BaseModel):
    id: int
    scenario: ScenarioSummary
    created_at: datetime
    finished_at: Optional[datetime] = None
    message_count: int
    summary_score: Optional[int] = None
    has_summary: bool


class SendMessageResponse(BaseModel):
    user_message: MessagePublic
    ai_message: MessagePublic
