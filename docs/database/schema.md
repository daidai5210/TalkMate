# TalkMate 数据库设计文档

> 版本：v1.0  
> 日期：2026-06-05  

---

## 一、users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户 ID |
| `username` | VARCHAR(50) | NOT NULL, UNIQUE | 用户名，3-50 字符 |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt 加密后的密码 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 最后更新时间 |
| `deleted_at` | TIMESTAMP | NULL, DEFAULT NULL | 软删除时间 |

**索引：**
- `uq_users_username_deleted_at` — UNIQUE(username, deleted_at)
- `idx_users_username` — 登录查询用

---

## 二、scenarios 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 场景 ID |
| `name` | VARCHAR(100) | NOT NULL | 场景名称 |
| `description` | VARCHAR(500) | NOT NULL | 场景描述 |
| `icon` | VARCHAR(50) | NOT NULL | 图标标识 |
| `prompt` | TEXT | NOT NULL | AI 系统提示词 |
| `sort_order` | INT | DEFAULT 0 | 排序序号 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | 最后更新时间 |

**索引：**
- `idx_scenarios_sort_order` — 排序查询

**种子数据（5 条）：**
- 面试 — 模拟英文面试问答
- 点餐 — 模拟餐厅点餐、结账
- 会议 — 模拟英文会议发言、讨论
- 旅行 — 模拟机场、酒店、问路、购物
- 日常 — 日常社交聊天

---

## 三、conversations 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 对话 ID |
| `user_id` | BIGINT | NOT NULL, FK → users.id | 所属用户 |
| `scenario_id` | BIGINT | NOT NULL, FK → scenarios.id | 关联场景 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `finished_at` | TIMESTAMP | NULL | 对话结束时间 |
| `deleted_at` | TIMESTAMP | NULL, DEFAULT NULL | 软删除时间 |

**索引：**
- `idx_conversations_user_id_created_at` — 用户历史列表
- `idx_conversations_scenario_id` — 按场景过滤

---

## 四、messages 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 消息 ID |
| `conversation_id` | BIGINT | NOT NULL, FK → conversations.id | 所属对话 |
| `role` | VARCHAR(10) | NOT NULL, CHECK(user/ai) | 角色 |
| `text` | TEXT | NOT NULL | 消息内容 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_messages_conversation_id` — 对话消息列表
- `idx_messages_conversation_id_created_at` — 按时间排序

---

## 五、summaries 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 总结 ID |
| `conversation_id` | BIGINT | NOT NULL, UNIQUE, FK → conversations.id | 一对一关联 |
| `score` | INT | NOT NULL, CHECK(0-100) | 综合评分 |
| `feedback` | TEXT | NOT NULL | 纠错反馈（JSON 数组） |
| `suggestions` | TEXT | NOT NULL | 改进建议（JSON 数组） |
| `grammar_issues` | TEXT | NULL | 语法问题统计（JSON） |
| `pronunciation_issues` | TEXT | NULL | 发音问题（JSON） |
| `vocabulary_usage` | TEXT | NULL | 词汇使用分析（JSON） |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `uq_summaries_conversation_id` — UNIQUE(conversation_id)

---

## 六、外键约束

| 从表 → 主表 | ON DELETE | 说明 |
|-------------|-----------|------|
| conversations.user_id → users.id | RESTRICT | 用户存在才能有对话 |
| conversations.scenario_id → scenarios.id | RESTRICT | 场景存在才能创建对话 |
| messages.conversation_id → conversations.id | CASCADE | 对话删除时消息一并删除 |
| summaries.conversation_id → conversations.id | CASCADE | 对话删除时总结一并删除 |

---

## 七、软删除策略

- 所有业务表（users、conversations）包含 `deleted_at`
- 删除时设置 `deleted_at = CURRENT_TIMESTAMP`
- 查询默认加 `WHERE deleted_at IS NULL`
- 唯一索引包含 `deleted_at`，允许删除后重新注册

---

## 八、迁移策略

| 操作 | 工具 | 说明 |
|------|------|------|
| 首次初始化 | SQLAlchemy `create_all()` | ORM 直接建表 |
| 后续变更 | Alembic | 新增/修改字段用迁移脚本 |
| 回滚 | Alembic `downgrade` | 每个迁移必须有 downgrade |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本 | 产品经理 |
