# TalkMate AI Prompt 设计文档

> 版本：v1.0  
> 关联任务：T-004（PR-012 + PR-013 拆分实现）  
> 日期：2026-06-05  
> 模块：backend/app/modules/ai_service

---

## 一、目标

替换 T-003 阶段的 `FIXED_AI_REPLY` 固定占位文字，接入 DeepSeek `deepseek-v4-flash` 模型，实现 5 个预设场景下的真实 AI 对话回复。

需求（来自 T-004 DoR）：
- AI 回复与当前场景相关
- 多轮上下文（基于前面对话继续）
- API 超时降级（返回降级文案，不影响用户继续操作）
- AI 调用日志（用于成本监控 + 问题排查）

---

## 二、技术选型

| 维度 | 选型 | 理由 |
|------|------|------|
| LLM 模型 | DeepSeek `deepseek-v4-flash` | 队长提供，OpenAI 兼容协议 |
| SDK | `openai` Python SDK（>=1.0） | DeepSeek 兼容 OpenAI，直接用 |
| Base URL | `https://api.deepseek.com/v1` | DeepSeek 官方 |
| 调用方式 | 同步 `chat.completions.create` | MVP 回合制够用，复杂度低 |
| 超时 | 5.0 秒 | 与"2 秒内回复"目标相比留 3 秒缓冲给网络 |

---

## 三、目录结构

```
backend/app/modules/ai_service/
├── __init__.py
├── exceptions.py       # AIServiceError / AITimeoutError / AIRateLimitError / AIUnavailableError
├── prompts.py          # build_messages 构造 OpenAI 兼容 messages
├── client.py           # DeepSeekClient(openai SDK 封装)
├── service.py          # AIService 门面(降级处理)
└── tests/
    ├── __init__.py
    └── test_ai_service.py  # 8 个 pytest,100% mock client
```

---

## 四、5 个场景的 Prompt 设计

每个场景的 `system prompt` 取自 `modules/scenario/seed.py` 的 `prompt` 字段。设计原则：
- **角色清晰**：明确告诉 AI 它是面试官 / 服务员 / 会议伙伴等
- **场景限定**：明确对话范围，避免 AI 跑题
- **语言适配**：英语口语场景 → 用英文交流；可补充中文解释
- **长度适中**：50-200 字，避免过长 prompt 增加 token 消耗

### 4.1 面试（id=1, sort_order=1）

```
你是一位经验丰富的英文面试官。用户正在准备英文面试,
请用英文与用户进行真实的面试对话,提出常见的面试问题
(自我介绍、职业经历、项目经验、优缺点等),并对用户的回答给出即时反馈。
```

**预期输出示例**：
- "Could you please introduce yourself briefly?"
- "What are your greatest strengths and weaknesses?"
- "Tell me about a challenging project you've worked on."

### 4.2 点餐（id=2, sort_order=2）

```
你是一位友好的餐厅服务员。用户正在练习英文点餐,
请用英文与用户完成点餐流程,包括询问座位、推荐菜品、下单、结账等环节。
```

**预期输出示例**：
- "Good evening! Welcome to our restaurant. How many people are in your party?"
- "May I recommend today's special, grilled salmon with seasonal vegetables."
- "Would you like anything to drink with that?"

### 4.3 会议（id=3, sort_order=3）

```
你是一位英文会议参与者。用户正在练习英文会议发言,
请用英文与用户进行会议讨论,场景包括工作汇报、方案讨论、意见表达等。
```

**预期输出示例**：
- "Thanks for the presentation. I'd like to hear more about the timeline."
- "Do we have any data to support that proposal?"
- "I think we should consider the budget impact as well."

### 4.4 旅行（id=4, sort_order=4）

```
你是一位热心的当地人。用户正在练习英文旅行沟通,
请用英文与用户进行旅行相关对话,场景包括机场值机、酒店入住、问路、购物等。
```

**预期输出示例**：
- "Hello! May I see your passport and booking confirmation, please?"
- "Your room is on the third floor, here is your key card."
- "Excuse me, could you tell me how to get to the train station?"

### 4.5 日常（id=5, sort_order=5）

```
你是一位友善的英语伙伴。用户正在练习日常英文对话,
请用英文与用户进行轻松的日常交流,话题包括兴趣爱好、生活琐事、天气、朋友等。
```

**预期输出示例**：
- "Hi! How's your day going so far?"
- "What kind of music do you usually listen to?"
- "Have you seen any good movies recently?"

---

## 五、多轮上下文策略

### 5.1 消息构造顺序

`build_messages(scenario_prompt, history, user_text, max_history=20)`：

```python
[
    {"role": "system", "content": scenario_prompt},   # 1 条系统 prompt
    # 历史消息(最近 max_history 条),按时间顺序
    {"role": "user", "content": "..."},
    {"role": "ai", "content": "..."},
    # ... 省略中间
    {"role": "user", "content": current_user_text}   # 当前用户消息
]
```

### 5.2 历史裁剪

- 保留**最近 20 条**历史消息（10 个 user/ai 回合）
- 超出部分从最早开始丢弃
- 防止 token 消耗爆炸（每条 ~50 token，上限 ~1000 token 历史 + 200 token 当前消息）

### 5.3 上下文连续性保证

- 每次新消息包含完整 system prompt + 完整历史（最近 20 条）+ 当前消息
- AI 在收到 history 时能"看到"前面对话，从而给出上下文相关的回复
- DoD 验收：第 4 项"多轮对话中 AI 能记住上下文"由此实现

---

## 六、超时与降级策略

### 6.1 异常分类

| 异常类型 | 触发条件 | 降级文案 |
|----------|----------|----------|
| `AITimeoutError` | API 调用超过 5 秒 | "AI 服务响应超时,请稍后重试。" |
| `AIRateLimitError` | API 返回 429 限流 | "AI 服务调用频率超限,请稍候再试。" |
| `AIUnavailableError` | 网络/鉴权/余额等 | "AI 服务暂不可用,请稍后重试。" |
| 其他未知异常 | 兜底 | "AI 服务暂不可用,请稍后重试。" |

### 6.2 降级行为

- **不抛异常**：AIService.send_message 捕获所有异常并返回降级文案
- **对话不中断**：用户消息已写入数据库（user_msg 已 commit），AI 回复也写入数据库（ai_msg 用降级文案）
- **前端无感知**：用户看到"AI 服务暂不可用..."作为 AI 回复，可以继续输入下一条

### 6.3 客户端表现

| 场景 | 用户看到 | 数据库 |
|------|----------|---------|
| 正常 | 真实 AI 回复 | user_msg + ai_msg(real) |
| 超时 | 降级文案 | user_msg + ai_msg(fallback) |
| 限流 | 降级文案 | user_msg + ai_msg(fallback) |
| 不可用 | 降级文案 | user_msg + ai_msg(fallback) |

---

## 七、日志规范

### 7.1 AIService.send_message 日志

```
INFO ai_service.send_message history_len=N scenario_prompt_len=M
```

- `N`：传入的历史消息数
- `M`：场景 prompt 字符数

### 7.2 DeepSeekClient.chat 日志

```
INFO ai_service.chat model=<model> prompt_msgs=N resp_len=M
    prompt_tokens=P completion_tokens=C total_tokens=T
```

- `model`：调用的模型名
- `N`：messages 列表长度（system + history + new）
- `M`：AI 响应字符数
- `P/C/T`：DeepSeek 返回的 token 计数（用于成本监控）

### 7.3 异常日志

```
WARNING ai_service timeout: <error>
WARNING ai_service rate limit: <error>
EXCEPTION ai_service unavailable: <error>
```

---

## 八、安全性

### 8.1 密钥管理

- **禁止** 将 `DEEPSEEK_API_KEY` 写入 `.env` 文件
- **禁止** 将 key 写入 Git 任何文件
- 启动时通过 `setsid env DEEPSEEK_API_KEY=...` 注入
- 队长通过私信单次发送 key，全栈在收到后立即用于服务启动

### 8.2 输入校验

- `scenario_prompt` 长度：受 `scenarios.prompt` 字段约束（TEXT，无强制限但前端不会传超长）
- `history` 长度：受 `max_history=20` 裁剪
- `user_text` 长度：受 `messages.text` 字段约束（TEXT, 实际前端 maxLength=5000）

### 8.3 输出处理

- AI 回复 `content` 可能为 `None`（DeepSeek 偶发情况），代码已做 `or ""` 兜底
- AI 回复不写入敏感字段（仅 message.text），可被普通用户读

---

## 九、性能与成本

### 9.1 期望性能

- 端到端延迟：用户发消息 → AI 回复显示 ≈ API 调用 + 100ms
- API 调用时长：理想 < 2s（DoD 验收项），超时阈值 5s

### 9.2 token 消耗估算

每轮对话：
- system prompt：~200 token
- 历史（20 条 × 50 token）：~1000 token
- 当前消息：~50 token
- AI 回复：~100 token
- **小计**：~1350 token / 轮

按 deepseek-v4-flash 定价（约 0.1 元/百万 token 输入，0.2 元/百万 token 输出），单轮成本约 0.0002 元（可忽略）。

---

## 十、测试策略

### 10.1 单元测试（pytest）

`tests/test_ai_service.py` 8 个用例，100% mock client：
- `test_build_messages_basic`：3 条消息正确构造
- `test_build_messages_truncates_history`：30 条历史截断到 10 条
- `test_build_messages_empty_history`：空历史只返回 system + new
- `test_service_returns_client_response`：mock 客户端返回的内容
- `test_service_timeout_fallback`：AITimeoutError → TIMEOUT 文案
- `test_service_rate_limit_fallback`：AIRateLimitError → RATE_LIMIT 文案
- `test_service_unavailable_fallback`：AIUnavailableError → UNAVAILABLE 文案
- `test_service_unexpected_error_fallback`：RuntimeError → UNAVAILABLE 文案（兜底）

### 10.2 集成测试（conversation pytest）

`tests/test_conversation.py` 7 个用例，新增 `mock_ai_client` fixture 注入 mock：
- 注册/登录/创建对话/获取对话/发送消息（mock AI 返回）全部通过
- 验证消息构造正确（user 在前、ai 在后、role 正确）

### 10.3 端到端测试（Playwright）

`tests/e2e/test_ai_e2e.py` 8 步：
- 登录 → 选面试场景 → 输入"Hello, I want to introduce myself" → 验证 AI 回复是相关面试问题（含 'introduce' / 'interview' 关键词）
- 发送第二轮"我做了 3 年后端开发" → 验证 AI 上下文相关（问到工作经历/技术栈）
- 验证 AI 回复时长 < 3s（端到端延迟）

### 10.4 真实 API 联调

- E2E 用真实 DeepSeek API，验证：
  - 真实 API key 可用
  - 5 个场景的 prompt 都能产生合理回复
  - 多轮上下文确实工作
  - 超时降级（手动 mock 超时场景）

---

## 十一、未来改进（T-005+）

| 改进项 | 触发条件 | 优先级 |
|--------|----------|---------|
| 流式回复 | T-005 语音交互 | P1 |
| 纠错反馈（语法/发音） | T-006 | P1 |
| 课后总结 | T-006 | P1 |
| 多 LLM 切换（GPT-4 等） | v0.2 多元化 | P2 |
| Prompt 版本管理（Git LFS） | 多 prompt 变体 A/B | P3 |
| Rate limit 重试（指数退避） | 高频用户 | P2 |

---

## 十二、关联文档

- [`./tech-stack.md`](./tech-stack.md) - 技术选型（DeepSeek v4-flash + openai SDK）
- [`../api/conversations.md`](../api/conversations.md) - 对话端点
- [`../api/api-design.md`](../api-design.md) - 统一响应格式
- [`../qa-reports/t-004-e2e-verification.md`](../qa-reports/t-004-e2e-verification.md) - 真实 API E2E 报告

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：DeepSeek 集成 + 5 场景 prompt + 多轮上下文 + 超时降级 | 全栈开发工程师 |
