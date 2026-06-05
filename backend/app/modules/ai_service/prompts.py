"""prompt 构造:system + 多轮历史 + 当前用户消息。"""
from typing import List, Sequence

from app.modules.conversation.models import Message

DEFAULT_MAX_HISTORY = 20

# OpenAI 兼容 API 的角色枚举与本项目数据库存储不同
# DB 存 'ai'(领域术语),OpenAI 协议用 'assistant',转换在边界层做
_ROLE_TO_OPENAI = {"user": "user", "ai": "assistant"}


def build_messages(
    scenario_prompt: str,
    history: Sequence[Message],
    user_text: str,
    max_history: int = DEFAULT_MAX_HISTORY,
) -> List[dict]:
    """构造 OpenAI 兼容的 messages 列表。

    Args:
        scenario_prompt: 系统提示词(场景设定 + 角色)
        history: 历史消息(Message 对象列表,role 字段为 user/ai)
        user_text: 当前用户消息
        max_history: 保留最近 N 条历史,避免超长上下文

    Returns:
        OpenAI chat.completions 格式的 messages 列表
    """
    messages: List[dict] = [{"role": "system", "content": scenario_prompt}]
    for msg in list(history)[-max_history:]:
        openai_role = _ROLE_TO_OPENAI.get(msg.role, msg.role)
        messages.append({"role": openai_role, "content": msg.text})
    messages.append({"role": "user", "content": user_text})
    return messages
