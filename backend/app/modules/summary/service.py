"""Summary 业务:生成纠错反馈 + 课后总结(调用 ai_service),持久化。"""
import json
import logging
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.ai_service.prompts import (
    build_feedback_messages,
    build_summary_messages,
)
from app.modules.ai_service.service import AIService
from app.modules.conversation.models import Conversation
from app.modules.conversation.repository import ConversationRepository
from app.modules.summary.models import Summary
from app.modules.summary.repository import SummaryRepository
from app.shared.exceptions import BusinessError

logger = logging.getLogger(__name__)

ERR_CONVERSATION_NOT_FOUND = 3001
ERR_CONVERSATION_EMPTY = 3002
ERR_SUMMARY_NOT_FOUND = 3003
ERR_SUMMARY_GENERATION_FAILED = 6001


class SummaryService:
    def __init__(
        self,
        db: Session,
        ai_service: Optional[AIService] = None,
    ):
        self.db = db
        self.repo = SummaryRepository(db)
        self.conv_repo = ConversationRepository(db)
        self.ai_service = ai_service or AIService()

    def get_existing(self, conversation_id: int, user_id: int) -> Summary:
        """只读取已生成总结。GET 不触发 AI 生成,便于前端呈现未生成 Empty 状态。"""
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv is None:
            raise BusinessError(ERR_CONVERSATION_NOT_FOUND, "对话不存在")
        if conv.user_id != user_id:
            raise BusinessError(4001, "无权访问该对话")

        existing = self.repo.get_by_conversation_id(conversation_id)
        if existing is None:
            raise BusinessError(ERR_SUMMARY_NOT_FOUND, "暂无总结,请先点击生成总结")
        return existing

    def get_or_generate(self, conversation_id: int, user_id: int) -> Summary:
        """获取或生成总结。已存在则返回,不存在则调 AI 生成。"""
        conv = self.conv_repo.get_by_id(conversation_id)
        if conv is None:
            raise BusinessError(ERR_CONVERSATION_NOT_FOUND, "对话不存在")
        if conv.user_id != user_id:
            raise BusinessError(4001, "无权访问该对话")

        existing = self.repo.get_by_conversation_id(conversation_id)
        if existing is not None:
            logger.info("summary cache hit conversation_id=%d", conversation_id)
            return existing

        messages = list(conv.messages)
        user_texts = [m.text for m in messages if m.role == "user"]
        if not user_texts:
            raise BusinessError(ERR_CONVERSATION_EMPTY, "对话无用户消息,无需总结")

        logger.info(
            "summary generating conversation_id=%d msg_count=%d",
            conversation_id,
            len(messages),
        )

        feedback = self._generate_feedback(messages, user_texts)
        summary_data = self._generate_summary(messages, user_texts)

        feedback_json = json.dumps(feedback, ensure_ascii=False)
        suggestions_json = json.dumps(
            summary_data.get("suggestions", []), ensure_ascii=False
        )
        grammar_issues_json = json.dumps(
            summary_data.get("grammar_issues", {}), ensure_ascii=False
        )
        vocabulary_usage_json = json.dumps(
            summary_data.get("vocabulary_usage", {}), ensure_ascii=False
        )

        new_summary = self.repo.add(
            conversation_id=conversation_id,
            score=summary_data.get("score", 0),
            feedback_json=feedback_json,
            suggestions_json=suggestions_json,
            grammar_issues_json=grammar_issues_json,
            vocabulary_usage_json=vocabulary_usage_json,
        )

        conv.finished_at = datetime.utcnow()
        self.db.commit()
        return new_summary

    def _generate_feedback(
        self, messages: list, user_texts: list[str]
    ) -> list[dict[str, Any]]:
        """调 AI 生成纠错反馈(原文→正确→为什么→改进)。"""
        try:
            ai_messages = build_feedback_messages(user_texts)
            raw = self.ai_service.client.chat(ai_messages)
            return self._parse_json_list(raw, "feedback")
        except Exception as e:
            logger.exception("feedback generation failed: %s", e)
            return []

    def _generate_summary(
        self, messages: list, user_texts: list[str]
    ) -> dict[str, Any]:
        """调 AI 生成课后总结(评分 + 词汇 + 建议)。"""
        try:
            ai_messages = build_summary_messages(user_texts)
            raw = self.ai_service.client.chat(ai_messages)
            return self._parse_json_object(raw)
        except Exception as e:
            logger.exception("summary generation failed: %s", e)
            return {
                "score": 0,
                "suggestions": [],
                "grammar_issues": {},
                "vocabulary_usage": {},
            }

    def _parse_json_list(self, raw: str, label: str) -> list[dict[str, Any]]:
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(
                line for line in lines if not line.strip().startswith("```")
            )
        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("AI 返回非 JSON(%s): %s", label, e)
            return []
        if not isinstance(data, list):
            return []
        return data

    def _parse_json_object(self, raw: str) -> dict[str, Any]:
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(
                line for line in lines if not line.strip().startswith("```")
            )
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error("AI 返回非 JSON(summary): %s", e)
            return {
                "score": 0,
                "suggestions": [],
                "grammar_issues": {},
                "vocabulary_usage": {},
            }
