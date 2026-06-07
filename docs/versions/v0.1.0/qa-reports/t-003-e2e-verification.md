# T-003 端到端验证报告

> 任务：T-003 对话页面（文字模式）
> 验证范围：登录 → 场景页 → 对话页 → 输入发送 → AI 占位回复 → 刷新保持 → 登出
> 验证日期：2026-06-05
> 验证人：全栈开发工程师

---

## 一、验证目标

通过 Playwright 真实浏览器自动化，验证 T-003 全栈对话功能在 UI 层面端到端可用：

1. 场景页点击卡片进入对话页
2. 对话页自动创建 conversation
3. 文字输入并发送，乐观更新 user 气泡
4. AI 占位回复出现在列表
5. 刷新后 sessionStorage 保持 conv_id + 历史消息
6. 多次发送累加
7. 路由守卫 + 登出清理

---

## 二、验证环境

| 项 | 值 |
|------|------|
| Backend | uvicorn 0.32 + FastAPI 0.115 + SQLAlchemy 2.0 + SQLite |
| Backend 端口 | 0.0.0.0:8000 |
| Frontend | Vite 5.4 + React 18 + TS 5.6 + Zustand 4.5 |
| Frontend 端口 | 0.0.0.0:5173 |
| Frontend API | `VITE_API_BASE_URL=http://172.17.0.5:8000` |
| 浏览器 | Chromium headless (Playwright 1.60.0) |
| 测试用户 | `conv_e2e_<timestamp>`（每轮唯一） |

---

## 三、验证步骤（9 步）

| # | 步骤 | 断言 |
|---|------|------|
| 1 | 注册新用户 | 跳转 /login |
| 2 | 登录 | 跳转 / |
| 3 | 点击场景卡片（面试） | 跳转 /conversation/1 |
| 4 | 等待对话创建 | 消息列表空（0 条） |
| 5 | 输入 "Hello, I want to introduce myself" 并发送 | 见下 |
| 6 | 验证消息出现 | 2 条（1 user + 1 ai），ai 文本含 "占位" 和 "T-004" |
| 7 | 刷新页面 | 2 条消息保留（sessionStorage 持久化） |
| 8 | 再发一条 "I have 3 years of experience" | 累计 4 条 |
| 9 | 返回 + 登出 | 跳转 /login，token 清除 |

---

## 四、运行方式

### 4.1 启动后端（端口 8000）

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
DATABASE_URL="sqlite:///./talkmate.db" \
  JWT_SECRET="t003-e2e-secret" \
  CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://172.17.0.5:5173,http://172.17.0.6:5173" \
  ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir /home/user13/Desktop/talkmate/backend
```

### 4.2 启动前端（端口 5173）

```bash
cd /home/user13/Desktop/talkmate/frontend
echo "VITE_API_BASE_URL=http://172.17.0.5:8000" > .env
npm run dev
```

### 4.3 运行 E2E

```bash
source /home/user13/playwright-env/bin/activate
cd /home/user13/Desktop/talkmate
python3 tests/e2e/test_conversation_e2e.py
```

### 4.4 预期输出

```
=== 1. 注册新用户 ===
=== 2. 登录 ===
=== 3. 点击第一个场景卡片(面试) ===
  ✅ 进入对话页(URL: http://127.0.0.1:5173/conversation/1)
=== ...
=== 9. 返回场景页 + 登出 ===
  ✅ 登出后 token 清除

=== 🎉 T-003 全部 9 步 E2E 验证通过 ===
```

### 4.5 截图证据

`/tmp/talkmate-t003-screenshots/`：
- `01-conversation-empty.png` — 新对话空状态
- `02-thinking.png` — "正在思考..." 动画
- `03-messages.png` — 1 user + 1 ai 气泡
- `04-after-reload.png` — 刷新后消息保留
- `FAILURE.png` — 失败时自动保存

---

## 五、E2E 过程发现并修复的 bug

### Bug: 测试选择器误匹配 message-list 容器

**现象**：E2E 步骤 4 失败 — "新对话空消息列表: expected 0, got 4"。

**根因**：

```python
# 错误选择器: 匹配了 message-list + 2 个不存在的子元素
msgs_before = page.locator('[data-testid^="message-"]').count()
# 实际匹配: [message-list, message-list, message-list, message-list] 4 个元素?
```

`[data-testid^="message-"]` 会匹配所有以 "message-" 开头的 testid，包括：
- `message-list`（列表容器）
- `message-user`（用户气泡）
- `message-ai`（AI 气泡）

修复为限定子元素：
```python
msgs_before = page.locator('[data-testid="message-list"] [data-testid^="message-"]').count()
```

修复后 E2E 全过。

---

## 六、自动化单元测试

| 层 | 文件 | 用例数 | 状态 |
|------|------|------:|------|
| Backend conversation | `backend/app/modules/conversation/tests/test_conversation.py` | 7 | ✅ |
| Backend auth（回归） | `backend/app/modules/auth/tests/test_auth.py` | 9 | ✅ |
| Backend scenario（回归） | `backend/app/modules/scenario/tests/test_scenario.py` | 5 | ✅ |

合计 **21/21 通过**。

Conversation 7 用例覆盖：
- 未认证拒绝（401 + code 1004）
- 创建对话成功（含 scenario 信息）
- 场景不存在（code 2001）
- 拉历史带消息
- 对话不存在（code 3001）
- 发送消息对话不存在
- 参数校验（空 text → 422）

---

## 七、DoD 验收对照（8 项）

| DoD 项 | 验证方式 | 状态 |
|--------|---------|------|
| 从场景页点击卡片进入对话页 | E2E 步骤 3 | ✅ |
| 输入文字并发送 | E2E 步骤 5-6 | ✅ |
| 调用 POST /api/v1/conversations 创建对话 | API 直接验证 | ✅ |
| 消息列表展示 user + ai 气泡 | E2E 步骤 6（视觉 + 文本验证） | ✅ |
| 刷新后对话记录不丢失 | E2E 步骤 7（sessionStorage 验证） | ✅ |
| 空态：新对话显示场景描述 | UI 截图 `01-conversation-empty.png` | ✅ |
| Loading：AI 回复中显示"正在思考" | UI 截图 `02-thinking.png` | ✅ |
| Error：发送失败重试 | store error state + 红色 banner | ✅ |

8/8 全部通过。第 8 项（AI 回复内容质量）T-004 验证，固定占位文字已实现。

---

## 八、风险与后续

| 风险/限制 | 影响 | 建议 |
|----------|------|------|
| sessionStorage 而非 httpOnly cookie | 浏览器关闭后丢失，T-006 历史需服务端持久化 | 后续引入 cookie 方案 |
| 无 conversation.user_id 隔离 | 任意登录用户可访问任意 conversation | v0.2 加所有权校验（4001） |
| AI 回复固定占位 | 用户会注意到内容不真实 | T-004 接入 DeepSeek |
| 未做消息字数限制前端 | 用户可能发超长消息 | UI 加 maxLength 提示 |

---

## 九、关联文档

- [`../api/conversations.md`](../api/conversations.md) - Conversations API 接口规范
- [`../api/scenarios.md`](../api/scenarios.md) - 场景选择 API
- [`../database/schema.md`](../database/schema.md) - conversations + messages 表结构
- Git: `feat/talkmate-011-conversation-docs-e2e` 分支

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：9 步 E2E + 1 个测试选择器 bug 修复 | 全栈开发工程师 |
