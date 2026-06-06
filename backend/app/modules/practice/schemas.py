"""Practice module schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PracticeCardOut(BaseModel):
    id: int
    scenario: str
    role: str
    content: str
    hint: Optional[str] = None
    difficulty: int

    model_config = {"from_attributes": True}


class EvaluateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class EvaluateOut(BaseModel):
    id: int
    score: int
    pronunciation: Optional[int] = None
    grammar: Optional[int] = None
    fluency: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PracticeRecordOut(BaseModel):
    id: int
    card_id: Optional[int] = None
    score: int
    pronunciation: Optional[int] = None
    grammar: Optional[int] = None
    fluency: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime
    card: Optional[PracticeCardOut] = None

    model_config = {"from_attributes": True}


class AchievementOut(BaseModel):
    key: str
    label: str
    description: str
    icon: str
    unlocked: bool
    unlocked_at: Optional[str] = None
