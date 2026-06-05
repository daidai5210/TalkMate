"""AI 服务编排:prompt 构造 + 调用客户端 + 超时降级 + 日志。"""
import logging
from typing import Optional, Sequence

from app.modules.ai_service.client import DeepSeekClient
from app.modules.ai_service.exceptions import (
    AIRateLimitError,
    AITimeoutError,
    AIUnavailableError,
)
from app.modules.ai_service.prompts import DEFAULT_MAX_HISTORY, build_messages
from app.modules.conversation.models import Message

logger = logging.getLogger(__name__)

FALLBACK_REPLY = "AI 服务暂不可用,请稍后重试。"

FALLBACK_TIMEOUT = "AI 服务响应超时,请稍后重试。"

FALLBACK_RATE_LIMIT = "AI 服务调用频率超限,请稍候再试。"


class AIService:
    """AI 服务门面。注入 client 便于测试。"""

    def __init__(
        self,
        client: Optional[DeepSeekClient] = None,
        max_history: int = DEFAULT_MAX_HISTORY,
    ):
        self.client = client or DeepSeekClient()
        self.max_history = max_history

    def send_message(
        self,
        scenario_prompt: str,
        history: Sequence[Message],
        user_text: str,
    ) -> str:
        """调用 AI 生成回复。失败时返回降级文案(不抛异常)。"""
        messages = build_messages(scenario_prompt, history, user_text, self.max_history)
        logger.info(
            "ai_service.send_message history_len=%d scenario_prompt_len=%d",
            len(history),
            len(scenario_prompt),
        )
        try:
            return self.client.chat(messages)
        except AITimeoutError:
            return FALLBACK_TIMEOUT
        except AIRateLimitError:
            return FALLBACK_RATE_LIMIT
        except AIUnavailableError:
            return FALLBACK_REPLY
        except Exception:
            logger.exception("ai_service unexpected error")
            return FALLBACK_REPLY
