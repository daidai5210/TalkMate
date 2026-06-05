"""Summary 仓储。"""
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.summary.models import Summary


class SummaryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_conversation_id(self, conversation_id: int) -> Optional[Summary]:
        return (
            self.db.query(Summary)
            .filter(Summary.conversation_id == conversation_id)
            .one_or_none()
        )

    def add(
        self,
        conversation_id: int,
        score: int,
        feedback_json: str,
        suggestions_json: str,
        grammar_issues_json: Optional[str] = None,
        vocabulary_usage_json: Optional[str] = None,
    ) -> Summary:
        summary = Summary(
            conversation_id=conversation_id,
            score=score,
            feedback=feedback_json,
            suggestions=suggestions_json,
            grammar_issues=grammar_issues_json,
            vocabulary_usage=vocabulary_usage_json,
            created_at=datetime.utcnow(),
        )
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        return summary
