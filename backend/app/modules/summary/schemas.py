"""Summary 请求/响应模型。"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.modules.summary.models import Summary


class FeedbackItem(BaseModel):
    original: str = Field(..., description="原文(用户实际说的)")
    corrected: str = Field(..., description="正确版本")
    reason: str = Field(..., description="为什么错")
    suggestion: str = Field(..., description="怎么改进")


class SuggestionItem(BaseModel):
    category: str = Field(..., description="建议类别(语法/词汇/表达/发音)")
    content: str = Field(..., description="建议内容")


class SummaryPublic(BaseModel):
    id: int
    conversation_id: int
    score: int
    feedback: List[FeedbackItem]
    suggestions: List[SuggestionItem]
    grammar_issues: Optional[dict] = None
    vocabulary_usage: Optional[dict] = None
    error_profile: Optional[dict] = None
    has_enough_data: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_json(cls, summary: Summary, has_enough_data: bool = False) -> "SummaryPublic":
        import json

        grammar_issues = json.loads(summary.grammar_issues) if summary.grammar_issues else None
        error_profile = None
        if isinstance(grammar_issues, dict):
            nested = grammar_issues.pop("error_profile", None)
            if isinstance(nested, dict):
                error_profile = {
                    key: value
                    for key, value in nested.items()
                    if key != "unknown" and isinstance(value, (int, float))
                }

        return cls(
            id=summary.id,
            conversation_id=summary.conversation_id,
            score=summary.score,
            feedback=[FeedbackItem(**item) for item in json.loads(summary.feedback or "[]")],
            suggestions=[
                SuggestionItem(**item)
                for item in json.loads(summary.suggestions or "[]")
            ],
            grammar_issues=grammar_issues,
            vocabulary_usage=(
                json.loads(summary.vocabulary_usage) if summary.vocabulary_usage else None
            ),
            error_profile=error_profile,
            has_enough_data=has_enough_data,
            created_at=summary.created_at,
        )
