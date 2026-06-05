"""ai-service pytest 测试。

覆盖:
- prompt 构造:system + history + user
- 多轮上下文裁剪(超过 max_history 截断)
- send_message 成功返回 client 输出
- send_message 超时返回 TIMEOUT 文案
- send_message 限流返回 RATE_LIMIT 文案
- send_message 不可用返回 UNAVAILABLE 文案
- send_message 未知异常返回 UNAVAILABLE 文案
"""
from unittest.mock import MagicMock

import pytest

from app.modules.ai_service.client import DeepSeekClient
from app.modules.ai_service.exceptions import (
    AIRateLimitError,
    AITimeoutError,
    AIUnavailableError,
)
from app.modules.ai_service.prompts import build_messages
from app.modules.ai_service.service import (
    FALLBACK_RATE_LIMIT,
    FALLBACK_REPLY,
    FALLBACK_TIMEOUT,
    AIService,
)
from app.modules.conversation.models import Message


def _make_msg(role: str, text: str, msg_id: int = 0) -> Message:
    m = MagicMock(spec=Message)
    m.role = role
    m.text = text
    m.id = msg_id
    return m


def test_build_messages_basic() -> None:
    history = [_make_msg("user", "hi"), _make_msg("ai", "hello")]
    msgs = build_messages("sys", history, "how are you?")
    assert msgs[0] == {"role": "system", "content": "sys"}
    assert msgs[1] == {"role": "user", "content": "hi"}
    assert msgs[2] == {"role": "ai", "content": "hello"}
    assert msgs[3] == {"role": "user", "content": "how are you?"}


def test_build_messages_truncates_history() -> None:
    history = [_make_msg("user", f"m{i}") for i in range(30)]
    msgs = build_messages("sys", history, "new", max_history=10)
    # system + 10 history + 1 new = 12
    assert len(msgs) == 12
    assert msgs[0]["role"] == "system"
    assert msgs[-1]["content"] == "new"
    # history is the last 10 of 30: msgs[1] is history[-10]=m20, msgs[10] is history[-1]=m29
    assert msgs[1]["content"] == "m20"
    assert msgs[10]["content"] == "m29"


def test_build_messages_empty_history() -> None:
    msgs = build_messages("sys", [], "hi")
    assert len(msgs) == 2
    assert msgs[0]["role"] == "system"
    assert msgs[1] == {"role": "user", "content": "hi"}


def test_service_returns_client_response() -> None:
    mock_client = MagicMock(spec=DeepSeekClient)
    mock_client.chat.return_value = "AI reply here"
    svc = AIService(client=mock_client, max_history=20)
    history = [_make_msg("user", "hi"), _make_msg("ai", "hello")]
    out = svc.send_message("sys", history, "new question")
    assert out == "AI reply here"
    mock_client.chat.assert_called_once()
    sent = mock_client.chat.call_args[0][0]
    assert sent[0] == {"role": "system", "content": "sys"}
    assert sent[-1] == {"role": "user", "content": "new question"}


def test_service_timeout_fallback() -> None:
    mock_client = MagicMock(spec=DeepSeekClient)
    mock_client.chat.side_effect = AITimeoutError("timeout")
    svc = AIService(client=mock_client)
    out = svc.send_message("sys", [], "hi")
    assert out == FALLBACK_TIMEOUT


def test_service_rate_limit_fallback() -> None:
    mock_client = MagicMock(spec=DeepSeekClient)
    mock_client.chat.side_effect = AIRateLimitError("rate limit")
    svc = AIService(client=mock_client)
    out = svc.send_message("sys", [], "hi")
    assert out == FALLBACK_RATE_LIMIT


def test_service_unavailable_fallback() -> None:
    mock_client = MagicMock(spec=DeepSeekClient)
    mock_client.chat.side_effect = AIUnavailableError("api down")
    svc = AIService(client=mock_client)
    out = svc.send_message("sys", [], "hi")
    assert out == FALLBACK_REPLY


def test_service_unexpected_error_fallback() -> None:
    mock_client = MagicMock(spec=DeepSeekClient)
    mock_client.chat.side_effect = RuntimeError("unknown")
    svc = AIService(client=mock_client)
    out = svc.send_message("sys", [], "hi")
    assert out == FALLBACK_REPLY
