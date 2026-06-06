"""prompt 构造:对话消息 / 纠错反馈 / 课后总结。"""
from typing import List, Sequence

from app.modules.conversation.models import Message

DEFAULT_MAX_HISTORY = 20


def build_messages(
    scenario_prompt: str,
    history: Sequence[Message],
    user_text: str,
    max_history: int = DEFAULT_MAX_HISTORY,
) -> List[dict]:
    """构造 OpenAI 兼容的 messages 列表(场景对话用)。

    Args:
        scenario_prompt: 系统提示词(场景设定 + 角色)
        history: 历史消息(Message 对象列表,user/ai 交替)
        user_text: 当前用户消息
        max_history: 保留最近 N 条历史,避免超长上下文

    Returns:
        OpenAI chat.completions 格式的 messages 列表
    """
    messages: List[dict] = [{"role": "system", "content": scenario_prompt}]
    for msg in list(history)[-max_history:]:
        messages.append({"role": _to_openai_role(msg.role), "content": msg.text})
    messages.append({"role": "user", "content": user_text})
    return messages


def _to_openai_role(role: str) -> str:
    """项目 DB 用 user/ai,OpenAI 协议用 user/assistant。"""
    return "assistant" if role == "ai" else "user"


def build_feedback_messages(user_texts: Sequence[str]) -> List[dict]:
    """构造纠错反馈 prompt。

    AI 返回 JSON 数组,每个元素:original/corrected/reason/suggestion。
    """
    system = (
        "You are a professional English teacher who specializes in error analysis "
        "for Chinese learners of English. You will receive a list of sentences the "
        "user said in a conversation.\n\n"
        "Identify ALL grammar mistakes, awkward expressions, or unnatural word choices.\n"
        "For each, output a JSON object with exactly these 4 fields:\n"
        '- "original": the exact original sentence the user said\n'
        '- "corrected": the corrected natural English version\n'
        '- "reason": a brief explanation of why it was wrong (1 sentence, in English)\n'
        '- "suggestion": a concrete suggestion on how to improve (1 sentence, in English)\n\n'
        "Output rules:\n"
        "- Output ONLY a JSON array (no markdown code fences, no commentary).\n"
        "- If the input is empty or has no mistakes, return an empty array []."
    )
    user_payload = "Sentences spoken by the learner:\n" + "\n".join(
        f"- {t}" for t in user_texts
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_payload},
    ]


def build_summary_messages(user_texts: Sequence[str]) -> List[dict]:
    """构造课后总结 prompt。

    AI 返回 JSON 对象:score(0-100)/suggestions(数组)/grammar_issues(对象)
    /vocabulary_usage(对象)。
    """
    system = (
        "You are a professional English teacher evaluating a Chinese learner's speaking "
        "practice session. You will receive the learner's sentences from a "
        "conversation.\n\n"
        "Provide a detailed evaluation as a JSON object with these exact fields:\n"
        '- "score": integer 0-100 (overall speaking quality considering pronunciation hints, grammar accuracy, vocabulary range, and fluency)\n'
        '- "suggestions": array of objects, each with '
        '"category" (one of: grammar, vocabulary, expression, pronunciation, intonation, linking, word_stress) '
        'and "content" (1-2 sentences of concrete, actionable advice in Chinese targeting Chinese learners\' common pitfalls)\n'
        '- "grammar_issues": object with fields like '
        '"tense_errors" (int), "subject_verb_agreement" (int), '
        '"article_usage" (int), "word_order" (int), "preposition_errors" (int), "other" (int)\n'
        '- "vocabulary_usage": object with fields like '
        '"unique_words" (int), "advanced_words_used" (array of strings), '
        '"repetitive_words" (array of strings), "level" (one of: beginner, intermediate, advanced), '
        '"pos_distribution" (object with counts for nouns, verbs, adjectives, adverbs)\n'
        '- "example_sentences": array of 2-3 objects, each with '
        '"original" (learner\'s sentence), "improved" (a more natural version), '
        '"explanation" (1 sentence in Chinese explaining the improvement)\n'
        '- "next_practice_advice": string (2-3 sentences in Chinese with specific recommendations '
        'for what to practice next, targeting the weakest areas identified)\n\n'
        "Output rules:\n"
        "- Output ONLY a JSON object (no markdown code fences, no commentary).\n"
        "- Be specific and constructive, not generic.\n"
        "- Focus on patterns (repeated mistakes), not just individual errors."
    )
    user_payload = "Learner sentences:\n" + "\n".join(f"- {t}" for t in user_texts)
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_payload},
    ]
