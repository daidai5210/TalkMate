"""Practice card seed data — 25 cards across 5 scenarios."""
from typing import List

from sqlalchemy.orm import Session

from app.modules.practice.models import PracticeCard

SEED_PRACTICE_CARDS: List[dict] = [
    # 面试 (5 cards)
    {"scenario": "面试", "role": "求职者", "content": "Tell me about yourself and your professional background.", "hint": "介绍你的姓名、专业领域和主要工作经历", "difficulty": 1},
    {"scenario": "面试", "role": "求职者", "content": "What are your greatest strengths and weaknesses?", "hint": "诚实地说出优势，同时展示你在改进弱点", "difficulty": 2},
    {"scenario": "面试", "role": "求职者", "content": "Where do you see yourself in five years?", "hint": "展示职业规划，与应聘公司的长期发展相结合", "difficulty": 2},
    {"scenario": "面试", "role": "面试官", "content": "Why should we hire you for this position?", "hint": "强调你的独特价值、技能和对公司的贡献", "difficulty": 3},
    {"scenario": "面试", "role": "求职者", "content": "Describe a challenging project you managed and how you handled it.", "hint": "用 STAR 方法：情境、任务、行动、结果", "difficulty": 3},
    # 点餐 (5 cards)
    {"scenario": "点餐", "role": "顾客", "content": "I'd like to make a reservation for two people at 7 PM tonight.", "hint": "预订用语：人数、时间、是否有特殊要求", "difficulty": 1},
    {"scenario": "点餐", "role": "顾客", "content": "Could you recommend some popular dishes from the menu?", "hint": "询问推荐菜品，可以提及饮食偏好", "difficulty": 1},
    {"scenario": "点餐", "role": "顾客", "content": "I have a food allergy. Can you check if this dish contains nuts?", "hint": "说明过敏信息，请服务员确认食材", "difficulty": 2},
    {"scenario": "点餐", "role": "服务员", "content": "How would you like your steak cooked? We have rare, medium, and well-done.", "hint": "回答牛排熟度偏好", "difficulty": 2},
    {"scenario": "点餐", "role": "顾客", "content": "Could we have the bill please? And can we split it two ways?", "hint": "结账用语：要账单、分开付款", "difficulty": 1},
    # 会议 (5 cards)
    {"scenario": "会议", "role": "参与者", "content": "I'd like to propose a new approach to our marketing strategy.", "hint": "提出建议时先总结现状，再说明改进方案", "difficulty": 2},
    {"scenario": "会议", "role": "主持人", "content": "Let's go around the table and get everyone's update on the project status.", "hint": "请每位成员简短汇报进度", "difficulty": 1},
    {"scenario": "会议", "role": "参与者", "content": "I respectfully disagree with that proposal. Here's my perspective.", "hint": "用礼貌的方式表达不同意见，并提供理由", "difficulty": 3},
    {"scenario": "会议", "role": "参与者", "content": "Could you clarify what you mean by 'scalable solution' in this context?", "hint": "遇到不理解的概念时，礼貌地请求解释", "difficulty": 2},
    {"scenario": "会议", "role": "主持人", "content": "To summarize, we've agreed on three action items for this week.", "hint": "会议结束时总结要点和行动项", "difficulty": 2},
    # 旅行 (5 cards)
    {"scenario": "旅行", "role": "旅客", "content": "Excuse me, which gate does flight CA123 to Beijing depart from?", "hint": "询问登机口位置", "difficulty": 1},
    {"scenario": "旅行", "role": "旅客", "content": "I'd like to check in and I have one suitcase to check as well.", "hint": "酒店/机场值机：说明预订信息、行李托运", "difficulty": 1},
    {"scenario": "旅行", "role": "旅客", "content": "Could you give me directions to the nearest subway station?", "hint": "问路：描述目的地、请求具体方向指引", "difficulty": 2},
    {"scenario": "旅行", "role": "旅客", "content": "Is there a pharmacy nearby? I need to get some medicine for a headache.", "hint": "找药店：说明症状，询问最近位置", "difficulty": 2},
    {"scenario": "旅行", "role": "旅客", "content": "How much does this souvenir cost? Can you give me a discount?", "hint": "购物：询问价格、尝试讲价", "difficulty": 1},
    # 日常 (5 cards)
    {"scenario": "日常", "role": "朋友", "content": "What do you usually do on weekends to relax and unwind?", "hint": "分享周末活动、兴趣爱好", "difficulty": 1},
    {"scenario": "日常", "role": "朋友", "content": "Have you watched any good movies or shows recently?", "hint": "推荐电影/剧集，说说为什么喜欢", "difficulty": 1},
    {"scenario": "日常", "role": "朋友", "content": "I'm thinking about starting a new hobby. Any suggestions?", "hint": "讨论爱好，询问建议并给出理由", "difficulty": 2},
    {"scenario": "日常", "role": "朋友", "content": "How do you stay motivated when learning a new language?", "hint": "分享语言学习方法和保持动力的技巧", "difficulty": 2},
    {"scenario": "日常", "role": "朋友", "content": "Tell me about a place you've always wanted to visit and why.", "hint": "描述梦想旅行目的地，说明原因", "difficulty": 1},
]


def seed_practice_cards(db: Session) -> int:
    if db.query(PracticeCard).count() > 0:
        return 0
    for data in SEED_PRACTICE_CARDS:
        db.add(PracticeCard(**data))
    db.commit()
    return len(SEED_PRACTICE_CARDS)