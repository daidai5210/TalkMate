"""场景模块种子数据(5 个预设场景)。"""
from typing import List

from sqlalchemy.orm import Session

from app.modules.scenario.models import Scenario

SEED_SCENARIOS: List[dict] = [
    {
        "name": "面试",
        "description": "模拟英文面试问答,提升求职英语口语表达能力",
        "icon": "💼",
        "prompt": (
            "你是一位经验丰富的英文面试官。用户正在准备英文面试,"
            "请用英文与用户进行真实的面试对话,提出常见的面试问题"
            "(自我介绍、职业经历、项目经验、优缺点等),并对用户的回答给出即时反馈。"
        ),
        "sort_order": 1,
    },
    {
        "name": "点餐",
        "description": "模拟餐厅点餐、结账等用餐场景",
        "icon": "🍽️",
        "prompt": (
            "你是一位友好的餐厅服务员。用户正在练习英文点餐,"
            "请用英文与用户完成点餐流程,包括询问座位、推荐菜品、下单、结账等环节。"
        ),
        "sort_order": 2,
    },
    {
        "name": "会议",
        "description": "模拟英文会议发言、讨论与汇报",
        "icon": "📊",
        "prompt": (
            "你是一位英文会议参与者。用户正在练习英文会议发言,"
            "请用英文与用户进行会议讨论,场景包括工作汇报、方案讨论、意见表达等。"
        ),
        "sort_order": 3,
    },
    {
        "name": "旅行",
        "description": "模拟机场、酒店、问路、购物等旅行场景",
        "icon": "✈️",
        "prompt": (
            "你是一位热心的当地人。用户正在练习英文旅行沟通,"
            "请用英文与用户进行旅行相关对话,场景包括机场值机、酒店入住、问路、购物等。"
        ),
        "sort_order": 4,
    },
    {
        "name": "日常",
        "description": "日常社交聊天,培养开口说英语的信心",
        "icon": "💬",
        "prompt": (
            "你是一位友善的英语伙伴。用户正在练习日常英文对话,"
            "请用英文与用户进行轻松的日常交流,话题包括兴趣爱好、生活琐事、天气、朋友等。"
        ),
        "sort_order": 5,
    },
]


def seed_scenarios(db: Session) -> int:
    """若 scenarios 表为空,写入 5 条种子数据。返回新增条数。"""
    if db.query(Scenario).count() > 0:
        return 0
    for data in SEED_SCENARIOS:
        db.add(Scenario(**data))
    db.commit()
    return len(SEED_SCENARIOS)
