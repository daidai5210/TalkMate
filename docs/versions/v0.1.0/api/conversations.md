# TalkMate Conversations API 文档

> 版本：v0.3.0  
> 关联任务：T-003（PR-009 ~ PR-011 拆分实现）  
> 日期：2026-06-05

---

## 一、概述

Conversations 模块负责对话的创建、消息发送、历史拉取。前端在用户从场景卡片进入对话页时调用 `POST /conversations` 创建新对话，之后用 `POST /conversations/:id/messages` 发送消息并通过 `GET /conversations/:id` 拉取历史。

MVP 阶段 AI 回复使用固定占位文字（"收到你的消息!这是占位回复,AI 集成将在 T-004 接入 DeepSeek API。"），T-004 将替换为真实 AI 调用。

本 API 严格遵循 [`./api-design.md`](./api-design.md) 的统一响应格式与错误码规范。

---

## 二、创建对话

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/conversations` |
| 认证 | **是**（Bearer token） |

**请求体**：

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| scenario_id | int | ✅ | > 0；场景必须存在 |

**成功响应（201）**：
```json
{
  "code": 0,
  "message": "创建对话成功",
  "data": {
    "id": 1,
    "scenario": { "id": 1, "name": "面试", "icon": "💼" },
    "created_at": "2026-06-05T00:00:00",
    "finished_at": null,
    "messages": []
  }
}
```

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1004 | Token 无效 | 缺失 / 伪造 / 过期 / 用户不存在 |
| 2001 | 场景不存在 | scenario_id 不在 scenarios 表 |

---

## 三、获取练习记录列表

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/conversations` |
| 认证 | **是**（Bearer token） |

**请求体**：无

**成功响应（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "scenario": { "id": 1, "name": "面试", "icon": "💼" },
      "created_at": "2026-06-05T10:00:00",
      "finished_at": "2026-06-05T10:05:00",
      "message_count": 6,
      "summary_score": 82,
      "has_summary": true
    }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | conversation id |
| scenario | object | 场景摘要，包含 id/name/icon |
| created_at | string | 对话创建时间 |
| finished_at | string/null | 对话结束时间，未结束为 null |
| message_count | int | 当前对话消息数 |
| summary_score | int/null | 已生成总结的评分；未生成总结为 null |
| has_summary | boolean | 是否已有课后总结 |

**行为说明**：
- 仅返回当前登录用户自己的未删除对话。
- 按创建时间倒序返回。
- `has_summary=false` 时前端不展示“查看总结”入口。

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1004 | Token 无效 | 缺失 / 伪造 / 过期 |

---

## 四、获取对话（含消息历史）

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/conversations/:id` |
| 认证 | **是**（Bearer token） |

**请求体**：无

**成功响应（200）**：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "scenario": { "id": 1, "name": "面试", "icon": "💼" },
    "created_at": "2026-06-05T00:00:00",
    "finished_at": null,
    "messages": [
      { "id": 1, "role": "user", "text": "Hello", "created_at": "2026-06-05T00:00:01" },
      { "id": 2, "role": "ai", "text": "占位回复...", "created_at": "2026-06-05T00:00:02" }
    ]
  }
}
```

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1004 | Token 无效 | 缺失 / 伪造 / 过期 |
| 3001 | 对话不存在 | id 不在 conversations 表 或已软删除 |
| 4001 | 无权访问 | conversation 不属于当前用户 |

---

## 五、发送消息

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/conversations/:id/messages` |
| 认证 | **是**（Bearer token） |

**请求体**：

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| text | string | ✅ | 1-5000 字符 |

**成功响应（200）**：
```json
{
  "code": 0,
  "message": "消息已发送",
  "data": {
    "user_message": { "id": 3, "role": "user", "text": "Hello", "created_at": "..." },
    "ai_message": { "id": 4, "role": "ai", "text": "占位回复...", "created_at": "..." }
  }
}
```

**行为说明**：
- 服务端同时写入 2 条 message（user + ai）
- ai_message 文本当前为固定占位文字，T-004 替换为 DeepSeek 回复
- user_message 和 ai_message 都有递增的 id

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1004 | Token 无效 | 缺失 / 伪造 / 过期 |
| 3001 | 对话不存在 | id 不存在 |
| 4001 | 无权访问 | conversation 不属于当前用户 |
| 422 | 参数错误 | text 缺失 / 长度不达标 |

---

## 六、错误码汇总

| code | 含义 | 触发模块 |
|------|------|----------|
| 0 | 成功 | 通用 |
| 1004 | Token 无效 | auth 共享 |
| 2001 | 场景不存在 | scenario |
| 3001 | 对话不存在 | conversation |
| 4001 | 无权访问 | conversation |
| 422 | 参数校验失败 | Pydantic 自动 |

---

## 七、字段长度限制

| 字段 | 最小 | 最大 | 说明 |
|------|------|------|------|
| scenario_id | 1 | - | 必须 > 0 |
| text (message) | 1 | 5000 | 单条消息字符上限 |

---

## 八、cURL 示例

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"Test1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 1. 创建对话
CONV_ID=$(curl -s -X POST http://127.0.0.1:8000/api/v1/conversations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scenario_id":1}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

# 2. 发送消息
curl -s -X POST http://127.0.0.1:8000/api/v1/conversations/$CONV_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, I want to introduce myself"}'

# 3. 拉历史
curl -s http://127.0.0.1:8000/api/v1/conversations/$CONV_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 九、客户端集成示例（React + Zustand）

```typescript
// features/conversation/conversationStore.ts (核心逻辑)
initFromScenario: async (scenario) => {
  const existingId = getStoredConvId(scenario.id);
  if (existingId) {
    try {
      const conv = await getApi(existingId);
      set({ conversation: conv });
      return;
    } catch { /* fallback to create */ }
  }
  const conv = await createApi(scenario.id);
  storeConvId(scenario.id, conv.id);
  set({ conversation: conv });
}
```

```typescript
// 发送消息 - 乐观更新模式
send: async (text) => {
  const tempId = -Date.now();
  set(s => ({
    conversation: { ...s.conversation!, messages: [...s.conversation!.messages, optimistic] },
    sending: true,
  }));
  const result = await sendApi(current.id, text);
  set(s => ({
    conversation: { ...s.conversation!, messages: replaceOptimistic + [result.ai_message] },
    sending: false,
  }));
}
```

---

## 十、关联文档

- [`./api-design.md`](./api-design.md) - 全局 API 设计
- [`../database/schema.md`](../database/schema.md) - conversations + messages 表结构
- [`../qa-reports/t-003-e2e-verification.md`](../qa-reports/t-003-e2e-verification.md) - E2E 验证报告

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | T-007：新增练习记录列表接口；详情/发送消息补齐用户隔离错误码 | 全栈开发工程师 |
| 2026-06-05 | 初始版本：T-003 三个端点 | 全栈开发工程师 |
