# TalkMate Scenarios API 文档

> 版本：v0.2.0  
> 关联任务：T-002（PR-006 ~ PR-008 拆分实现）  
> 日期：2026-06-05

---

## 一、概述

Scenarios 模块负责练习场景的查询。前端首页在用户登录后调用此接口获取 5 个预设场景（面试/点餐/会议/旅行/日常），以卡片形式展示。

种子数据在服务启动时由 lifespan 自动写入 scenarios 表（如表为空则写入 5 条，否则保持现状）。

本 API 严格遵循 [`./api-design.md`](./api-design.md) 的统一响应格式与错误码规范。

---

## 二、获取场景列表

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/scenarios` |
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
      "name": "面试",
      "description": "模拟英文面试问答,提升求职英语口语表达能力",
      "icon": "💼"
    },
    {
      "id": 2,
      "name": "点餐",
      "description": "模拟餐厅点餐、结账等用餐场景",
      "icon": "🍽️"
    },
    {
      "id": 3,
      "name": "会议",
      "description": "模拟英文会议发言、讨论与汇报",
      "icon": "📊"
    },
    {
      "id": 4,
      "name": "旅行",
      "description": "模拟机场、酒店、问路、购物等旅行场景",
      "icon": "✈️"
    },
    {
      "id": 5,
      "name": "日常",
      "description": "日常社交聊天,培养开口说英语的信心",
      "icon": "💬"
    }
  ]
}
```

**排序规则**：按 `sort_order` 升序，再按 `id` 升序。

---

## 三、字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 场景唯一 ID |
| name | string | 场景中文名（面试/点餐/会议/旅行/日常） |
| description | string | 场景描述，前端卡片副标题 |
| icon | string | emoji 图标，前端卡片左上角展示 |

> 注：后端 `scenarios` 表还包含 `prompt`（AI 系统提示词）、`sort_order`、`created_at`、`updated_at` 字段，但这些仅供后端内部使用（AI 集成模块 T-004 实施时会用到），不在公开 API 暴露。

---

## 四、错误码

| code | 含义 | 触发条件 |
|------|------|----------|
| 1004 | Token 无效 | 缺失 / 伪造 / 过期 |
| 5001 | 数据库错误 | 服务端异常 |

> 1001-1006 业务错误码针对 auth 模块。Scenario 模块当前仅返回 1004（未认证）。

---

## 五、种子数据

服务首次启动时（`scenarios` 表为空），`lifespan` 会自动写入 5 条种子数据：

| id | name | sort_order | prompt 摘要 |
|---|------|---|---------|
| 1 | 面试 | 1 | 英文面试官视角，自我介绍/职业经历/项目经验等问题 |
| 2 | 点餐 | 2 | 餐厅服务员视角，座位/菜品/下单/结账 |
| 3 | 会议 | 3 | 会议参与者视角，工作汇报/方案讨论/意见表达 |
| 4 | 旅行 | 4 | 当地人视角，机场/酒店/问路/购物 |
| 5 | 日常 | 5 | 日常伙伴视角，兴趣/生活/天气/朋友 |

种子数据完整 prompt 详见 `backend/app/modules/scenario/seed.py`。

如需重新触发种子数据写入（如手动清空 scenarios 表后），重启服务即可。

---

## 六、cURL 示例

```bash
# 1. 登录获取 token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"Test1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 2. 获取场景列表
curl -s http://127.0.0.1:8000/api/v1/scenarios \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## 七、客户端集成示例（React + Zustand）

```typescript
// features/scenario/scenarioStore.ts
import { create } from 'zustand';
import { listScenarios } from './scenarioService';
import type { Scenario } from './types';

interface ScenarioState {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchScenarios: () => Promise<void>;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  loading: false,
  error: null,
  fetched: false,
  fetchScenarios: async () => {
    set({ loading: true, error: null });
    try {
      const scenarios = await listScenarios();
      set({ scenarios, loading: false, fetched: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取场景失败';
      set({ loading: false, error: message, fetched: true });
    }
  },
}));
```

```typescript
// app/HomePage.tsx 使用
useEffect(() => {
  if (!fetched) fetchScenarios();
}, [fetched, fetchScenarios]);
```

---

## 八、关联文档

- [`./api-design.md`](./api-design.md) - 全局 API 设计
- [`../database/schema.md`](../database/schema.md) - scenarios 表结构
- [`../qa-reports/t-002-e2e-verification.md`](../qa-reports/t-002-e2e-verification.md) - E2E 验证报告

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：T-002 GET /api/v1/scenarios | 全栈开发工程师 |
