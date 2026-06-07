"""Profile request/response schemas."""
from typing import Optional

from pydantic import BaseModel, Field


class ErrorProfileItem(BaseModel):
    error_type: str
    label: str
    total_count: int
    recent_count: int


class ErrorSummaryResponse(BaseModel):
    total_conversations: int
    window_size: int
    profiles: list[ErrorProfileItem]
    has_enough_data: bool


class NextGoalResponse(BaseModel):
    has_enough_data: bool
    recommended_scenario_id: Optional[int] = None
    recommended_scenario_name: Optional[str] = None
    focus_error_type: Optional[str] = None
    focus_error_label: Optional[str] = None
    reason: Optional[str] = None
    hint: Optional[str] = None
