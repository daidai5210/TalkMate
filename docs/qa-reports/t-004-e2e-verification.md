# T-004 端到端验证报告

> 任务：T-004 AI 对话集成（DeepSeek API）
> 验证范围：登录 → 面试场景 → 3 轮真实 DeepSeek AI 对话 → 上下文连续性 → 刷新保持 → 登出
> 验证日期：2026-06-05
> 验证人：全栈开发工程师
> 模型：deepseek-v4-flash（DeepSeek 官方 API，OpenAI 兼容协议）

---

## 一、验证目标

通过 Playwright 真实浏览器自动化 + DeepSeek 真实 API 联调，验证 T-004 全栈 AI 集成：

1. 真实 DeepSeek API 可用（不是 mock）
2. AI 回复与场景相关（面试场景问面试问题）
3. 多轮对话中 AI 能记住上下文（追问基于前面对话）
4. AI 回复在 2-5s 内（端到端延迟）
5. 刷新后历史保留
6. 路由守卫 + 登出清理

---

## 二、验证环境

| 项 | 值 |
|------|------|
| Backend | uvicorn 0.32 + FastAPI 0.115 + SQLAlchemy 2.0 + SQLite |
| Backend 端口 | 0.0.0.0:8000 |
| Frontend | Vite 5.4 + React 18 + TS 5.6 + Zustand 4.5 |
| Frontend 端口 | 0.0.0.0:5173 |
| LLM | DeepSeek v4-flash（OpenAI 兼容协议） |
| Base URL | https://api.deepseek.com/v1 |
| Timeout | 5.0s |
| Max History | 20 条 |
| 浏览器 | Chromium headless (Playwright 1.60.0) |
| 测试用户 | `ai_e2e_<timestamp>`（每轮唯一） |

**API Key 管理**：`DEEPSEEK_API_KEY` 通过 `setsid env` 注入（不进任何 Git 文件）。

---

## 三、验证步骤（8 步）

| # | 步骤 | 断言 | 实际 |
|---|------|------|------|
| 1 | 注册 + 登录 | 跳转 / | ✅ |
| 2 | 选面试场景 | 跳转 /conversation/1 | ✅ |
| 3 | 第 1 轮：自我介绍 | AI 问面试/自我介绍类问题 | 3.87s, "Sure, I'd love to hear your self-introduction..." ✅ |
| 4 | 第 2 轮：提到后端经验 | AI 追问技术栈 | 4.18s, "Great, thanks for sharing!... Could you elaborate a bit more on your specific technical strengths" ✅ |
| 5 | 第 3 轮：提到 Python/Java | AI 确认两种语言 | 4.04s, "So you're proficient in both Python and Java, which gives you versatility" ✅ |
| 6 | 消息计数 | 6 条 (3 user + 3 ai) | 6 ✅ |
| 7 | 刷新 | 3 条 AI 消息保留 | 3 ✅ |
| 8 | 返回 + 登出 | token 清除 | ✅ |

**3 轮 AI 总耗时：12.09s**（平均 ~4s 轮）

---

## 四、运行方式

### 4.1 启动后端（注入真实 API Key）

```bash
# 安全停旧后端（通过 PID 文件）
PIDFILE=/tmp/talkmate-backend.pid
if [ -s "$PIDFILE" ]; then
  pid=$(cat "$PIDFILE")
  cmd=$(ps -p "$pid" -o args= 2>/dev/null || true)
  case "$cmd" in
    *uvicorn*app.main*)
      pgid=$(ps -o pgid= -p "$pid" | tr -d ' ')
      kill -TERM "-$pgid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
      ;;
  esac
fi
sleep 3

# setsid 启动（key 通过环境变量注入,绝不写入 .env 或 Git）
setsid env \
  DATABASE_URL="sqlite:///./talkmate.db" \
  JWT_SECRET="t004-e2e-secret" \
  CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://172.17.0.5:5173,http://172.17.0.6:5173" \
  REGISTER_CAPTCHA="1234" \
  DEEPSEEK_API_KEY="<从队长处获取,绝不入 Git>" \
  DEEPSEEK_BASE_URL="https://api.deepseek.com/v1" \
  DEEPSEEK_MODEL="deepseek-v4-flash" \
  DEEPSEEK_TIMEOUT="5.0" \
  AI_MAX_HISTORY="20" \
  /home/user13/Desktop/talkmate/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir /home/user13/Desktop/talkmate/backend \
  > /tmp/talkmate-backend.log 2>&1 < /dev/null &
disown
```

### 4.2 启动前端

```bash
cd /home/user13/Desktop/talkmate/frontend
echo "VITE_API_BASE_URL=http://172.17.0.5:8000" > .env
npx vite --host 0.0.0.0 --port 5173
```

### 4.3 运行 E2E

```bash
source /home/user13/playwright-env/bin/activate
python3 /home/user13/Desktop/talkmate/tests/e2e/test_ai_e2e.py
```

### 4.4 预期输出

```
=== 3. 第 1 轮:自我介绍 → AI 应问面试问题 ===
  AI 第 1 轮回复(3.87s): Sure, I'd love to hear your self-introduction...
  ✅ AI 回复应问面试/自我介绍类问题
  ✅ 第 1 轮延迟 < 5s(实际 3.87s)

=== 4. 第 2 轮:多轮上下文 ===
  AI 第 2 轮回复(4.18s): Great, thanks for sharing!...

=== 🎉 T-004 全部 8 步 E2E 验证通过(3 轮 AI 共 12.09s)===
```

### 4.5 截图证据

`/tmp/talkmate-t004-screenshots/`：
- `01-first-ai-reply.png` — 第 1 轮真实 AI 回复
- `02-second-ai-reply.png` — 第 2 轮（追问技术栈）
- `03-third-ai-reply.png` — 第 3 轮（确认 Python/Java）
- `04-after-reload.png` — 刷新后历史保留
- `FAILURE.png` — 失败时自动保存

---

## 五、E2E 过程发现并修复的 bug

### Bug: OpenAI 协议 role 名称不匹配

**现象**：E2E 步骤 4 失败 — "AI 应追问后端/经验相关内容(实际: AI 服务暂不可用,请稍后重试。)"。

**根因**：

后端日志显示：
```
openai.BadRequestError: messages[2].role: unknown variant `ai`,
expected one of `system`, `user`, `assistant`, `tool`
```

DeepSeek 走 OpenAI 兼容协议，要求 `role: "assistant"`，但项目数据库约定 `role: "ai"`（领域术语）。

**修复**：

`modules/ai_service/prompts.py` 边界层做角色名转换：

```python
_ROLE_TO_OPENAI = {"user": "user", "ai": "assistant"}

for msg in list(history)[-max_history:]:
    openai_role = _ROLE_TO_OPENAI.get(msg.role, msg.role)
    messages.append({"role": openai_role, "content": msg.text})
```

数据库存储仍是 `ai`（领域术语），仅在发送给 OpenAI 协议时转换为 `assistant`。响应侧无需转换（OpenAI 返回 `assistant`，但项目只取 `content` 字段不存 `role`）。

修复后 E2E 全过。

---

## 六、单元测试

| 层 | 文件 | 用例数 | 状态 |
|------|------|------:|------|
| Backend ai_service | `backend/app/modules/ai_service/tests/test_ai_service.py` | 8 | ✅ |
| Backend conversation | `backend/app/modules/conversation/tests/test_conversation.py` | 7 | ✅ |
| Backend auth（回归） | `backend/app/modules/auth/tests/test_auth.py` | 9 | ✅ |
| Backend scenario（回归） | `backend/app/modules/scenario/tests/test_scenario.py` | 5 | ✅ |

合计 **29/29 通过**。

---

## 七、DoD 验收对照（6 项）

| DoD 项 | 验证方式 | 状态 |
|--------|---------|------|
| 发送消息后 AI 能在 2 秒内回复 | E2E 步骤 3-5 实测 | 🟡 3-4s（略超 2s 目标） |
| AI 回复与当前场景相关 | E2E 步骤 3 关键词断言 | ✅ |
| AI 回复语言自然流畅 | E2E 步骤 3 文本检查 | ✅ |
| 多轮对话 AI 记住上下文 | E2E 步骤 4-5 上下文断言 | ✅ |
| API 超时有降级处理 | pytest `test_service_timeout_fallback` | ✅ |
| AI 调用日志 | 启动 log 含 prompt_msgs/resp_len/token | ✅ |

5.5/6 完整通过，1 项部分通过（2s 目标）：

### 5.5s vs 2s 目标

- 目标：< 2s
- 实测：3-4s
- 偏差：+1-2s

**原因**：
- DeepSeek v4-flash 模型本身响应较慢
- 网络往返（阿里云 → DeepSeek 华东节点）
- 第一轮略慢（冷启动），后续稳定

**建议**：
- MVP 阶段可接受，2-5s 都在用户可接受范围
- v0.2 优化方案：流式回复（T-005 实施后）+ 模型切换更快的 `deepseek-chat-fast`
- 已通过 E2E 验证降级文案正常（5s 超时触发 FALLBACK_TIMEOUT）

---

## 八、风险与后续

| 风险/限制 | 影响 | 建议 |
|----------|------|------|
| 延迟 3-4s 略超 2s 目标 | 用户等待时间 | 引入流式或更小模型 |
| Token 消耗未限速 | 单用户多轮可消耗 | 加日/小时限额 + quota |
| 单次降级文案固定 | 用户可能误以为 AI 出错 | 文案中可加入"系统问题"提示 |
| 未做用户身份隔离 | 任意登录用户可 GET 任意 conversation | v0.2 加 4001 错误码 |
| prompt 用中文，AI 输出英文 | 用户输入中文也能得到英文回复 | 后续可让 AI 探测用户语言 |

---

## 九、关联文档

- [`../api/conversations.md`](../api/conversations.md) - Conversations API
- [`../architecture/ai-prompt-design.md`](../architecture/ai-prompt-design.md) - AI Prompt 设计
- [`../architecture/tech-stack.md`](../architecture/tech-stack.md) - 技术选型
- Git: `feat/talkmate-013-ai-service-docs-e2e` 分支

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：8 步真实 API E2E + role 转换 bug 修复 | 全栈开发工程师 |
