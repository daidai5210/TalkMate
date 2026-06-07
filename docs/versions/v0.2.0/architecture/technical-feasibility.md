---
document_id: v0.2.0/architecture/technical-feasibility
project_version: v0.2.0
target_release: v0.2.0
route: B
status: confirmed
owner: FS
last_updated: 2026-06-07
upstream:
  - docs/versions/v0.2.0/version-brief.md
downstream:
  - docs/versions/v0.2.0/product/prd.md
  - docs/versions/v0.2.0/architecture/
---

# TalkMate v0.2.0 技术可行性评估

> 评估日期：2026-06-07 | 评估人：系统架构师（FS）| 发起人：PM
> 路线：B — 旧项目功能迭代 | 基线版本：v0.1.0（commit `898bfbd`）

---

## 1. 基本信息

| 字段 | 内容 |
|---|---|
| 项目名称 | TalkMate |
| 关联需求 | 中文母语错误画像 + 个性化复练闭环 |
| 关联范围清单 | 见 `version-brief.md` 版本范围 |
| 发起人 | PM |
| 评估人 | FS（系统架构师）|
| 期望完成时间 | 2026-06-07 |

---

## 2. PM 提供的评估输入

| 输入 | 内容 |
|---|---|
| 业务目标 | 让用户知道自己"中式英语"的具体问题和类型分布，基于画像推荐下一次练习目标，形成"发现弱点→定向练习→再检测"的闭环 |
| P0 范围 | ① 总结页 + 首页轻量入口 ② 5 类固定错误：中式语序、时态、冠词、介词、直译表达 ③ 每次只推荐 1 个下次练习目标 ④ 画像按最近 5 次练习聚合 ⑤ 不做独立能力画像页、不做多语言/课程/社交/复杂脚本 |
| 明确不做项 | 独立能力画像页、多语言支持、课程系统、社交功能、复杂数据脚本、Native App |
| 关键约束 | 不改动现有对话核心流程；AI 调用基于现有 DeepSeek v4-flash；前端保持 React + TypeScript + Tailwind；部署沿用 Vercel + TiDB |
| 需要回答的问题 | 是否可实现？推荐方案和备选方案？复杂度/SP？API/数据模型/权限/部署影响？主要风险和 PM 需要确认的取舍？ |

---

## 3. FS 评估结论

### 3.1 是否可实现

**结论：可实现。**

现有架构（FastAPI + SQLAlchemy + DeepSeek API + React/TypeScript）完全支持此功能，无需引入新技术栈。

核心理由：
- **错误画像的数据源已存在**：现有 `summaries` 表已有 `grammar_issues`、`feedback` 等 JSON 字段，v0.1.0 的 AI prompt 在总结阶段已输出纠错反馈。画像本质是对这些现有数据的聚合和分类。
- **5 类错误类型可映射到 AI prompt 输出**：只需在总结 prompt 中增加结构化输出要求（要求 AI 将纠错归类到 5 个 bucket），后端做聚合。
- **推荐逻辑是纯计算**：基于最近 5 次练习的聚合结果做排序和推荐，不涉及新的 AI 调用或外部服务。

### 3.2 推荐方案

**方案 A：基于现有 summaries 数据的轻量聚合 + AI prompt 增强（推荐）**

```
┌─────────────────────────────────────────────────────┐
│                    现有流程（不变）                    │
│  对话 → AI 总结 → summaries 表                       │
│                   │                                 │
│                   ▼ (新增)                           │
│  ┌─────────────────────────────────────┐            │
│  │ 总结 prompt 增强：要求 AI 输出 5 类   │            │
│  │ 错误标签 + 结构化 JSON               │            │
│  └─────────────────────────────────────┘            │
│                   │                                 │
│                   ▼                                 │
│  ┌─────────────────────────────────────┐            │
│  │ 新增 user_error_profiles 表          │            │
│  │ (user_id, error_type, count,         │            │
│  │  last_updated, conversation_ids)     │            │
│  └─────────────────────────────────────┘            │
│                   │                                 │
│                   ▼                                 │
│  ┌─────────────────────────────────────┐            │
│  │ 总结页: 展示本次错误分布 + 画像对比   │            │
│  │ 首页: 轻量入口（下次练习推荐）        │            │
│  └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

实现要点：

1. **AI prompt 增强**（后端 `ai_service/prompts.py`）：
   - 在总结生成 prompt 中增加指令：对每条纠错标注 `error_type`（5 选 1）
   - 输出格式增加 `error_profile: { "word_order": 2, "tense": 1, "article": 0, "preposition": 1, "direct_translation": 3 }`
   - 不改变现有 prompt 结构，仅在末尾追加分类指令

2. **新增数据表 `user_error_profiles`**：
   - 存储每个用户按错误类型的累计计数
   - 每次总结生成后增量更新
   - 保留最近 N 次对话的 ID 列表用于滑动窗口计算

3. **新增 API 端点**（2 个）：
   - `GET /api/v1/profile/error-summary` — 获取用户 5 类错误画像（最近 5 次聚合）
   - `GET /api/v1/profile/next-goal` — 获取推荐的下一次练习目标

4. **前端改动**：
   - 总结页：在现有总结下方增加"本次错误画像"卡片
   - 首页：在场景选择上方增加轻量推荐 banner

### 3.3 备选方案

**方案 B：纯前端聚合（不推荐）**

将 5 类错误分类逻辑放在前端，从 summaries 表中读取最近 5 次 `feedback` 字段，前端做关键词匹配归类。

| 维度 | 方案 A（推荐） | 方案 B |
|---|---|---|
| AI 分类准确性 | 高（AI 直接输出标签） | 低（关键词匹配不稳定） |
| 后端改动 | 中（新表 + 新 API） | 无 |
| 数据一致性 | 高（后端统一聚合） | 低（前端计算，每次重算） |
| 可扩展性 | 高（后续可加趋势、对比） | 低（纯展示层） |

方案 B 不推荐：分类逻辑在前端会让数据不可信、不可复用，且关键词匹配对"直译表达"这种语义类错误几乎无效。

### 3.4 实现复杂度与工作量估算

| 维度 | 评估 | 说明 |
|---|---|---|
| 实现复杂度 | 低-中 | 核心是数据聚合 + 1 个新表 + 2 个新 API + prompt 微调 |
| 前端复杂度 | 低 | 总结页新增 1 个卡片组件，首页新增 1 个轻量 banner |
| 后端复杂度 | 低-中 | 1 个新模型 + 1 个新 service + 2 个新路由 + prompt 增强 |
| 预计 SP | 3-5 SP（约 3-5 人日） | S1 数据模型(1SP) + S2 后端 API(1.5SP) + S3 前端(1SP) + S4 联调验证(0.5-1.5SP) |

### 3.5 架构影响

| 维度 | 影响 |
|---|---|
| 整体架构 | 无影响，不改变现有分层（FastAPI → Service → ORM → DB） |
| 模块边界 | 新增 `backend/app/modules/profile/` 模块，独立于现有模块 |
| 前端路由 | 不新增路由，在现有总结页和首页内嵌展示 |
| 状态管理 | 不新增 Zustand store，用现有 store 扩展 |

### 3.6 API 影响

| 影响类型 | 详情 |
|---|---|
| 新增端点 | `GET /api/v1/profile/error-summary` — 返回用户 5 类错误画像 |
| 新增端点 | `GET /api/v1/profile/next-goal` — 返回推荐场景 + 重点改善错误类型 |
| 修改端点 | `POST /api/v1/conversations/:id/summary` — prompt 增强，返回增加 `error_profile` |
| 修改端点 | `GET /api/v1/conversations/:id/summary` — 返回增加 `error_profile` |
| 向后兼容 | 是 — 新增字段为 optional，旧客户端忽略即可 |
| 认证要求 | 所有新端点需 JWT 认证 |

### 3.7 数据模型影响

新增表：

```sql
CREATE TABLE user_error_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    error_type VARCHAR(30) NOT NULL,  -- word_order/tense/article/preposition/direct_translation
    total_count INT DEFAULT 0,
    recent_count INT DEFAULT 0,
    recent_conversation_ids JSON NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE,
    UNIQUE KEY uq_user_error_type (user_id, error_type),
    INDEX idx_user_id (user_id)
);
```

现有表变更：无结构变更。`summaries` 表现在 JSON 字段可直接承载 AI 输出的分类数据。

数据量估算：每用户 5 行 × 1000 用户 = 5000 行，可忽略。

### 3.8 权限影响

无影响。所有数据按 `user_id` 隔离，与现有接口权限模型一致。用户只能查看自己的画像数据。

### 3.9 部署影响

| 维度 | 影响 |
|---|---|
| 数据库迁移 | 需要 1 次 Alembic migration（新增表） |
| 环境变量 | 无新增 |
| 第三方服务 | 无新增（仍用 DeepSeek API） |
| Vercel 配置 | 无变更 |
| 回滚方案 | 删除新表 + 回滚 migration + 前端隐藏入口即可 |

### 3.10 主要风险与应对

| 风险 | 概率 | 影响 | 应对 |
|---|---|---|---|
| AI 错误分类不准确 | 中 | 中 | prompt 中给出每类错误明确定义和示例；增加 unknown 兜底；v0.3 允许用户手动修正 |
| 5 类错误定义边界模糊 | 中 | 低 | 提供 prompt 示例区分"时态"和"中式语序"的交叉场景 |
| 滑动窗口计算性能 | 低 | 低 | 当前用户量 <1000，直接 SQL 聚合即可 |
| 推荐逻辑过于简单 | 低 | 低 | 当前"最高频错误→对应场景"已满足 v0.2.0 需求 |
| 画像数据在首 5 次练习前为空 | 中 | 低 | 前端展示"完成 5 次练习后解锁"引导文案 |

### 3.11 需要 PM/队长确认的取舍

| 编号 | 问题 | 推荐方向 | 影响 |
|---|---|---|---|
| Q1 | 首 5 次练习前画像为空，首页入口是否显示？ | 显示"完成 5 次练习后解锁"引导 | 前端交互 |
| Q2 | 5 类错误是否允许 AI 输出 unknown？ | 允许，unknown 不参与聚合和推荐 | prompt 设计 |
| Q3 | 推荐目标场景是否限定现有 5 个场景？ | 是，限定面试/点餐/会议/旅行/日常 | 推荐逻辑 |
| Q4 | 画像数据在对话删除时是否同步清理？ | 对话删除时从滑动窗口移除，累计计数保留 | 数据一致性 |
| Q5 | 是否需要历史画像快照（趋势图）？ | v0.2.0 不做，仅保留最近 5 次 | v0.3.0 可加 |
| Q6 | summaries 表是否新增专用 error_profile 列？ | 推荐复用现有 JSON 字段，不新增列 | 表结构 |

---

## 4. PM 决策

| 编号 | 问题 | PM 决策 |
|---|---|---|
| Q1 | 首 5 次练习前画像为空，首页入口是否显示？ | 显示引导文案"完成 5 次练习后解锁你的中式英语画像" |
| Q2 | 5 类错误是否允许 AI 输出 unknown？ | 允许，unknown 不参与聚合和推荐，前端不展示 |
| Q3 | 推荐场景是否限定现有 5 个场景？ | 是，限定在面试/点餐/会议/旅行/日常 |
| Q4 | 对话删除时画像数据清理策略？ | 从滑动窗口移除该次对话，累计计数保留 |
| Q5 | 是否需要历史画像快照（趋势图）？ | v0.2.0 不做，后续版本考虑 |
| Q6 | summaries 表是否新增专用 error_profile 列？ | 复用现有 JSON 字段，不新增列 |

采纳方案：方案 A（后端聚合 + AI prompt 增强 + 1 个新表 + 2 个新 API）
放弃方案：方案 B（纯前端聚合）
范围调整：无
排期影响：无，按 3-5 SP 估算
是否需要队长确认：否（PM 已确认 Q1-Q6）
是否允许进入开发前准入门禁：是，进入 DoR 门禁

---

## 5. 一对一派发记录（待填写）

```text
任务：
责任人：FS
输入材料：
完成标准：
截止或检查点：
是否需要 @ PM 汇报：是
```

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-07 | 初始版本：技术可行性评估完成，结论为可实现 | 系统架构师 |