"""DeepSeek API 客户端(基于 openai Python SDK,DeepSeek 兼容 OpenAI 协议)。"""
import logging
from typing import Optional

from app.core.config import get_settings
from app.modules.ai_service.exceptions import (
    AIRateLimitError,
    AITimeoutError,
    AIUnavailableError,
)

logger = logging.getLogger(__name__)


class DeepSeekClient:
    """DeepSeek API 客户端。

    通过 openai SDK 调用,base_url/api_key/model/timeout 全部从配置注入,便于测试 mock。
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        try:
            from openai import OpenAI
        except ImportError as e:
            raise AIUnavailableError("openai 包未安装,无法调用 DeepSeek") from e

        settings = get_settings()
        self.client = OpenAI(
            api_key=api_key or settings.DEEPSEEK_API_KEY,
            base_url=base_url or settings.DEEPSEEK_BASE_URL,
            timeout=timeout or settings.DEEPSEEK_TIMEOUT,
        )
        self.model = model or settings.DEEPSEEK_MODEL

    def chat(self, messages: list[dict]) -> str:
        """同步调用 chat.completions.create,返回 AI 文本回复。"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
            )
        except Exception as e:
            self._classify_error(e)

        content = response.choices[0].message.content or ""
        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", None) if usage else None
        completion_tokens = getattr(usage, "completion_tokens", None) if usage else None
        total_tokens = getattr(usage, "total_tokens", None) if usage else None
        logger.info(
            "ai_service.chat model=%s prompt_msgs=%d resp_len=%d "
            "prompt_tokens=%s completion_tokens=%s total_tokens=%s",
            self.model,
            len(messages),
            len(content),
            prompt_tokens,
            completion_tokens,
            total_tokens,
        )
        return content

    @staticmethod
    def _classify_error(e: Exception) -> None:
        """将 openai 异常分类为内部 AIServiceError 后抛出。"""
        name = type(e).__name__
        msg = str(e).lower()
        if "timeout" in name.lower() or "timeout" in msg:
            logger.warning("ai_service timeout: %s", e)
            raise AITimeoutError(str(e)) from e
        if "rate" in msg or "429" in msg:
            logger.warning("ai_service rate limit: %s", e)
            raise AIRateLimitError(str(e)) from e
        logger.exception("ai_service unavailable: %s", e)
        raise AIUnavailableError(str(e)) from e
