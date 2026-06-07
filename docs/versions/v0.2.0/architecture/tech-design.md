---
document_id: v0.2.0/architecture/tech-design
project_version: v0.2.0
target_release: v0.2.0
route: B
status: confirmed
owner: FS
last_updated: 2026-06-07
upstream:
  - docs/versions/v0.2.0/product/prd.md
  - docs/versions/v0.2.0/architecture/technical-feasibility.md
  - docs/versions/v0.2.0/version-brief.md
downstream:
  - docs/versions/v0.2.0/tasks/
  - docs/versions/v0.2.0/qa/
---

# TalkMate v0.2.0 技术设计文档

> 路线：B — 旧项目功能迭代 | 基线版本：v0.1.0（commit `898bfbd`）
> 目标版本：v0.2.0 | 评估人：FS

---

## 1. 设计概要

### 1.1 设计范围

基于 PRD 和 FS 可行性评估结论，本次增量设计覆盖以下改动：

| 编号 | 改动项 | 类型 | 影响模块 |
|---|---|---|---|
| D-001 | AI 总结 prompt 增强，增加 5 类错误标签输出 | 修改 | ai_service, summary |
| D-002 | 新增 `user_error_profiles` 表 + ORM 模型 | 新增 | profile |
| D-003 | 新增 `GET /api/v1/profile/error-summary` 端点 | 新增 | profile |
| D-004 | 新增 `GET /api/v1/profile/next-goal` 端点 | 新增 | profile |
| D-005 | 总结页新增本次错误画像卡片 | 新增 | frontend: SummaryPage |
| D-006 | 首页新增练习推荐 banner | 新增 | frontend: HomePage |
| D-007 | 对话删除时滑动窗口同步 | 修改 | conversation, profile |

### 1.2 设计原则

- **最小侵入**：不改动现有对话核心流程，不影响现有 API 契约
- **增量扩展**：新增 profile 模块，独立于现有 auth/scenario/conversation/summary/ai_service
- **向后兼容**：新增字段均为 optional，旧客户端忽略即可
- **数据复用**：画像数据来源于现有 summaries 表的 AI 输出，不新增 AI 调用

---

## 2. 数据流设计

### 2.1 错误画像数据流

```
┌──────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ 用户完成  │───>│ POST .../summary  │───>│ SummaryService       │
│ 对话     │    │ (生成总结)        │    │ get_or_generate()   │
└──────────┘    └──────────────────┘    └──────┬──────────────┘
                                               │
                           ┌───────────────────┼───────────────────┐
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
                    │ _generate_   │  │ _generate_   │  │ _update_error_    │
                    │ feedback()   │  │ summary()    │  │ profile()  ← 新增  │
                    └──────────────┘  └──────┬───────┘  └────────┬─────────┘
                                             │                    │
                                             ▼                    ▼
                                    ┌──────────────┐  ┌──────────────────┐
                                    │ summaries 表  │  │ user_error_       │
                                    │ (含 error_    │  │ profiles 表       │
                                    │  profile)     │  │ (增量更新)        │
                                    └──────────────┘  └──────────────────┘
```

### 2.2 推荐查询数据流

```
┌──────────┐    ┌──────────────────┐    ┌──────────────────┐
│ 首页加载  │───>│ GET /profile/    │───>│ ProfileService     │
│          │    │ next-goal        │    │ get_next_goal()   │
└──────────┘    └──────────────────┘    └────────┬─────────┘
                                                  │
                    ┌─────────────────────────────┼──────────────────┐
                    │                             │                  │
                    ▼                             ▼                  ▼
           ┌──────────────┐            ┌──────────────┐   ┌──────────────┐
           │ 查询 user_    │            │ 找到最高频    │   │ 映射到对应    │
           │ error_profiles│            │ 错误类型      │   │ 场景          │
           └──────────────┘            └──────────────┘   └──────────────┘
```

### 2.3 对话删除时的画像同步

```
DELETE /conversations/:id
        │
        ▼
  ConversationService.delete()
        │
        ├──> 软删除 conversations.deleted_at
        ├──> 级联软删除 messages
        └──> ProfileService.remove_from_window()  ← 新增
                  │
                  ▼
          从 user_error_profiles.recent_conversation_ids 中移除该对话 ID
          重新计算 recent_count（基于剩余窗口内的对话）
          total_count 保持不变
```

---

## 3. 数据模型设计

### 3.1 新增表：user_error_profiles

```sql
CREATE TABLE user_error_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    error_type VARCHAR(30) NOT NULL
        CHECK (error_type IN (
            'word_order', 'tense', 'article',
            'preposition', 'direct_translation'
        )),
    total_count INT DEFAULT 0,
    recent_count INT DEFAULT 0,
    recent_conversation_ids JSON NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE,
    UNIQUE KEY uq_user_error_type (user_id, error_type),
    INDEX idx_user_id (user_id)
);
```

**字段说明：**

| 字段 | 类型 | 说明 |
|---|---|---|
| total_count | INT | 累计计数（所有历史练习），对话删除时保留 |
| recent_count | INT | 最近 5 次练习计数（滑动窗口） |
| recent_conversation_ids | JSON | 最近 5 次对话 ID 列表，按时间倒序，用于删除对话时移除 |

**数据量估算：** 每用户 5 行 × 1000 用户 = 5000 行，可忽略。

### 3.2 现有表变更

| 表 | 变更 | 说明 |
|---|---|---|
| summaries | 无结构变更 | 现有 `grammar_issues` JSON 字段可直接承载 AI 输出的 error_profile 数据 |
| 其他表 | 无变更 | — |

### 3.3 error_profile 在 summaries 中的形态

AI 增强后的 summary prompt 输出 JSON 中新增 `error_profile` 字段：

```json
{
  "score": 75,
  "grammar_issues": { ... },
  "error_profile": {
    "word_order": 2,
    "tense": 1,
    "article": 0,
    "preposition": 1,
    "direct_translation": 2,
    "unknown": 0
  }
}
```

- `unknown` 类型仅 AI 可输出，不写入 `user_error_profiles` 表
- 后端在解析时过滤 `unknown`，只写入 5 种有效类型

---

## 4. 模块设计

### 4.1 新增模块：profile

目录结构：

```
backend/app/modules/profile/
├── __init__.py
├── models.py          # UserErrorProfile ORM 模型
├── repository.py      # ProfileRepository 数据访问
├── service.py         # ProfileService 业务逻辑
├── schemas.py         # Pydantic 请求/响应模型
├── routes.py          # FastAPI 路由
└── tests/
    ├── __init__.py
    └── test_profile.py
```

### 4.2 模块职责

| 模块 | 职责 |
|---|---|
| models.py | `UserErrorProfile` ORM 模型，映射 `user_error_profiles` 表 |
| repository.py | 单用户画像 CRUD，滑动窗口查询，聚合统计 |
| service.py | 画像更新（总结后触发）、画像查询、推荐计算 |
| schemas.py | `ErrorProfileSummary`、`NextGoalResponse` 等响应模型 |
| routes.py | `GET /profile/error-summary`、`GET /profile/next-goal` |

### 4.3 模块注册

在 `backend/app/db/base.py` 的 `init_db()` 中注册新模型：

```python
from app.modules.profile.models import UserErrorProfile  # noqa: F401
```

在 `backend/app/api/v1/__init__.py` 中注册路由：

```python
from app.modules.profile.routes import router as profile_router
api_v1_router.include_router(profile_router)
```

---

## 5. API 设计

### 5.1 GET /api/v1/profile/error-summary

获取用户 5 类错误画像（最近 5 次练习聚合）。

| 项 | 值 |
|---|---|
| 路径 | `GET /api/v1/profile/error-summary` |
| 认证 | JWT |
| 参数 | 无 |

**响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_conversations": 12,
    "window_size": 5,
    "profiles": [
      { "error_type": "word_order", "label": "中式语序", "total_count": 8, "recent_count": 3 },
      { "error_type": "tense", "label": "时态", "total_count": 5, "recent_count": 2 },
      { "error_type": "article", "label": "冠词", "total_count": 3, "recent_count": 0 },
      { "error_type": "preposition", "label": "介词", "total_count": 4, "recent_count": 1 },
      { "error_type": "direct_translation", "label": "直译表达", "total_count": 6, "recent_count": 2 }
    ],
    "has_enough_data": true
  }
}
```

**空状态（练习次数 < 5）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_conversations": 2,
    "window_size": 5,
    "profiles": [],
    "has_enough_data": false
  }
}
```

### 5.2 GET /api/v1/profile/next-goal

获取推荐的下一次练习目标。

| 项 | 值 |
|---|---|
| 路径 | `GET /api/v1/profile/next-goal` |
| 认证 | JWT |
| 参数 | 无 |

**响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "has_enough_data": true,
    "recommended_scenario_id": 1,
    "recommended_scenario_name": "面试",
    "focus_error_type": "word_order",
    "focus_error_label": "中式语序",
    "reason": "最近 5 次练习中，中式语序问题出现 3 次，是最常见的错误类型"
  }
}
```

**空状态（练习次数 < 5）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "has_enough_data": false,
    "hint": "完成 5 次练习后解锁你的中式英语画像"
  }
}
```

### 5.3 推荐映射逻辑

**错误类型 → 推荐场景映射表：**

| 错误类型 | 推荐场景 | 理由 |
|---|---|---|
| word_order（中式语序） | 面试 | 正式场合对语序要求最高 |
| tense（时态） | 会议 | 涉及过去/现在/未来多时间线 |
| article（冠词） | 日常 | 生活场景中冠词使用频率最高 |
| preposition（介词） | 旅行 | 地点/方向介词密集 |
| direct_translation（直译表达） | 日常 | 地道表达在生活场景中差异最大 |

**推荐优先级：** recent_count 最高 → total_count 最高（平局时）→ 按映射表顺序。

### 5.4 修改端点：POST /conversations/:id/summary

**变更内容：** AI prompt 增强 + 返回数据增加 `error_profile` 字段。

`SummaryService.get_or_generate()` 在 `_generate_summary()` 返回后，新增调用 `_update_error_profile(user_id, summary_data)`。

**SummaryPublic 响应新增字段：**

```json
{
  "code": 0,
  "data": {
    "score": 75,
    "feedback": [...],
    "error_profile": {
      "word_order": 2,
      "tense": 1,
      "article": 0,
      "preposition": 1,
      "direct_translation": 2
    }
  }
}
```

---

## 6. AI Prompt 增强设计

### 6.1 变更位置

`backend/app/modules/ai_service/prompts.py` 的 `build_summary_messages()` 函数。

### 6.2 变更内容

在现有 system prompt 末尾追加错误分类指令：

```
Additionally, classify each grammar issue into exactly one of these 5 "
"Chinese-learner error types and output a separate `error_profile` field:\n"
"- `word_order`: wrong word order due to Chinese sentence structure\n"
"- `tense`: missing or incorrect tense (past/present/future/perfect)\n"
"- `article`: missing, extra, or wrong article (a/an/the)\n"
"- `preposition`: wrong preposition choice (in/on/at/to/for/with)\n"
"- `direct_translation`: unnatural expression directly translated from Chinese\n"
"- `unknown`: if the error doesn't fit any of the above\n\n"
"Output `error_profile` as a JSON object with all 6 keys, each value is the count (int):\n"
'`"error_profile": {"word_order": 2, "tense": 1, "article": 0, "preposition": 1, "direct_translation": 3, "unknown": 0}`\n\n'
"Classification rules:\n"
"- Each grammar issue maps to exactly ONE error_type\n"
"- `unknown` is a last resort — prefer the 5 specific types\n"
"- Word order vs tense: if the sentence structure is Chinese-like but tenses are correct, classify as word_order\n"
"- Direct translation vs others: if the expression is grammatically correct but unnatural, classify as direct_translation"
```

### 6.3 兼容性处理

- 如果 AI 未返回 `error_profile` 字段（旧 prompt 兼容），后端使用空字典，不更新画像
- 前端 `error_profile` 为 optional 字段，旧客户端忽略
- 这保证了向后兼容，不影响现有功能

---

## 7. 前端设计

### 7.1 总结页：本次错误画像卡片

**位置：** `SummaryPage.tsx`，在"语法问题"卡片上方新增。

**组件：** `ErrorProfileCard`（新组件）

**UI 设计：**

```
┌─────────────────────────────────────┐
│ 📊 本次中式英语画像                   │
│                                     │
│ 中式语序    ████████████  2         │
│ 时态        ██████  1              │
│ 冠词        ░░░░░░░░  0           │
│ 介词        ██████  1              │
│ 直译表达    ████████████████  3    │
│                                     │
│ 💡 最高频：直译表达 — 建议多练习地道表达 │
└─────────────────────────────────────┘
```

**空状态：** 本次练习无有效错误分类（error_profile 全为 0 或 AI 未返回），不展示该卡片。

**显示条件：** 仅当 `summary.error_profile` 存在且 `Object.values(error_profile).some(v => v > 0)` 时展示。

### 7.2 首页：练习推荐 banner

**位置：** `HomePage.tsx`，在 hero section 和 scenario list 之间新增。

**组件：** `TrainingRecommendBanner`（新组件）

**数据获取：** 新增 `profileService.ts` 调用 `GET /api/v1/profile/next-goal`

**UI 设计（有数据时）：**

```
┌─────────────────────────────────────┐
│ 🎯 建议练习：面试                     │
│ 重点改善：中式语序                    │
│ 最近 5 次练习中，中式语序问题出现 3 次    │
│                                     │
│      [开始针对性练习]                  │
└─────────────────────────────────────┘
```

**UI 设计（空状态）：**

```
┌─────────────────────────────────────┐
│ 📊 中式英语画像                        │
│ 完成 5 次练习后解锁你的中式英语画像      │
│                                     │
│      [开始练习]                       │
└─────────────────────────────────────┘
```

### 7.3 新增文件清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `frontend/src/services/profileService.ts` | 新增 | 调用 profile API |
| `frontend/src/components/ErrorProfileCard.tsx` | 新增 | 总结页画像卡片 |
| `frontend/src/components/TrainingRecommendBanner.tsx` | 新增 | 首页推荐 banner |
| `frontend/src/pages/SummaryPage.tsx` | 修改 | 引入 ErrorProfileCard |
| `frontend/src/app/HomePage.tsx` | 修改 | 引入 TrainingRecommendBanner |

---

## 8. 下游影响分析

### 8.1 数据库迁移

需要 1 次 Alembic migration 创建 `user_error_profiles` 表。

执行命令：
```bash
cd backend && alembic revision --autogenerate -m "add user_error_profiles table"
alembic upgrade head
```

### 8.2 部署顺序

1. 执行数据库 migration（先于代码部署）
2. 部署后端（新增 profile 模块 + prompt 增强）
3. 部署前端（新增画像卡片 + 推荐 banner）

### 8.3 回滚方案

1. 前端隐藏 ErrorProfileCard 和 TrainingRecommendBanner
2. 后端下线 profile 路由（移除路由注册）
3. 删除 `user_error_profiles` 表
4. 回滚 Alembic migration

不影响现有功能。

### 8.4 测试范围

| 层级 | 内容 | 用例数 |
|---|---|---|
| 单元测试 | ProfileService 画像更新/查询/推荐逻辑 | 5+ |
| 单元测试 | Prompt 增强后 AI 输出解析 | 3+ |
| 集成测试 | GET /profile/error-summary 正常/空状态 | 2 |
| 集成测试 | GET /profile/next-goal 正常/空状态 | 2 |
| 集成测试 | POST /summary 后画像数据正确更新 | 2 |
| 回归测试 | 现有 summary 生成不受影响 | 3 |
| E2E | 总结页画像卡片展示 + 首页推荐 banner | 2 |

---

## 9. 风险与应对

| 风险 | 应对 |
|---|---|
| AI 未返回 error_profile 字段 | 后端做字段缺失兜底，不更新画像，不影响总结生成 |
| 滑动窗口在对话删除时数据不一致 | 使用 `recent_conversation_ids` JSON 重新计算，而非依赖计数 |
| 新表在 SQLite 和 TiDB 之间的类型差异 | 使用 `PK_TYPE` 模式（BigInteger + Integer variant），与现有表一致 |
| 前端空状态加载闪烁 | 先判断 `has_enough_data`，再渲染对应 UI，避免先渲染再切换 |

---

## 10. 任务拆分

| 编号 | 任务 | 模块 | SP | 依赖 |
|---|---|---|---|---|
| S1 | 新增 `user_error_profiles` 模型 + Alembic migration | 后端 | 1 | — |
| S2 | 新增 `profile` 模块（service + repository + schemas） | 后端 | 1 | S1 |
| S3 | AI 总结 prompt 增强（error_profile 输出） | 后端 | 0.5 | — |
| S4 | 总结生成后触发画像更新 | 后端 | 0.5 | S2, S3 |
| S5 | 新增 `GET /profile/error-summary` + `GET /profile/next-goal` | 后端 | 1 | S2 |
| S6 | 对话删除时滑动窗口同步 | 后端 | 0.5 | S2 |
| S7 | 总结页新增 ErrorProfileCard 组件 | 前端 | 0.5 | S5 |
| S8 | 首页新增 TrainingRecommendBanner 组件 | 前端 | 0.5 | S5 |
| S9 | profileService 前端 API 层 | 前端 | 0.5 | S5 |
| S10 | 联调 + 验证 | 全栈 | 1 | S1-S9 |

**总计：** 约 6.5 SP（含 1 SP 联调验证），与可行性评估 3-5 SP 的估算略有增加，主要因为拆分更细粒度和新增对话删除同步逻辑。

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-07 | 初始版本：数据模型 + API + prompt + 前端 + 任务拆分 | FS |