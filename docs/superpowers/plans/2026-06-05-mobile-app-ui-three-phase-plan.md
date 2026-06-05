# Mobile App UI Adjustment Three-Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TalkMate 从“移动端可用网页”调整为“手机端优先的 AI 口语训练 App”，并通过完整用户交互测试发现、记录、修复体验问题。

**Architecture:** 采用“Mobile App Shell + 任务训练流”。第一阶段只做 UI/App 化实现和必要组件拆分；第二阶段做完整功能与用户体验验证并记录问题；第三阶段按 Issue 循环修复，每轮只定向复测修复范围。

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS，FastAPI + SQLAlchemy + SQLite，Playwright Python E2E，pytest，Git 本地小阶段提交 + 大阶段远程 PR。

---

## 0. 当前基线与执行规则

### 0.1 已完成的当前阶段提交

- 当前 S2 UIUX 讨论产物已本地提交。
- 提交：`74727e7 docs(uiux): 记录手机端App化调整方案`
- 分支：`docs/mobile-app-ui-plan`

### 0.2 当前工作区风险

执行前必须确认当前工作区存在未提交业务变更：

- 多个 `frontend/src/**` 文件已有 UI 改动。
- 新增 `frontend/src/features/training/`。
- `talkmate.db` 有本地运行数据变更，不得提交。

这些变更不能无审查直接提交。执行阶段开始时必须先完成变更归属检查，确认哪些纳入第一阶段 UI 实现，哪些丢弃、保留或另行拆分。

### 0.3 Git 与 PR 规则

- 每个小阶段完成后必须本地 commit。
- 每个大阶段完成后必须 push 远程分支并创建 PR。
- 不得提交 `.env`、密钥、`talkmate.db`、`backend/talkmate.db`、`node_modules`、`venv`、`dist`、缓存、测试中间产物。
- 如果第二阶段发现 P0/P1 问题，第一阶段 PR 不合并；第三阶段修复 commit 追加到对应实现分支。
- 如果问题在第一阶段 PR 合并后发现，则从 `main` 新建 `fix/ISSUE-xxx-简短说明` 分支修复。

### 0.4 Subagent 判断

- 是否可并行：否。
- 是否使用 Subagent：否。
- 原因：第一阶段多个任务会修改同一批核心前端页面和共享布局文件，存在样式、状态、交互冲突；第二阶段测试结果会直接影响第三阶段修复范围，需要主 Agent 统一判断。

---

## 1. 三阶段总览

| 大阶段 | 阶段目标 | 阶段性质 | 输出产物 | 大阶段 PR |
|---|---|---|---|---|
| 阶段一 | 实现手机端 App 化 UI 调整 | S4 开发实施 | App Shell、页面调整、状态补齐、构建通过、开发记录 | `[开发实施] 手机端App化界面调整` |
| 阶段二 | 完整测试功能与用户体验，发现问题 | S5 联调验证 | E2E 脚本、测试报告、截图证据、Issue 清单 | `[联调验证] 手机端App化体验验证` |
| 阶段三 | 按第二阶段问题循环修复与定向复测 | S4/S5 循环 | Fix commit、复测记录、Issue 状态更新 | `[缺陷修复] 修复手机端体验验证问题` |

---

## 2. 阶段一：手机端 App 化 UI 实现

### 阶段目标

完成 UI 层从网页式布局到手机 App 式布局的实现。重点不是新增业务能力，而是让登录、注册、首页、对话、总结、历史回放在手机视口下像 App 一样使用。

### 阶段输入

- `docs/uiux/UI-001-mobile-app-layout-adjustment-discussion.md`
- `docs/architecture/ui-ux-design.md`
- 当前前端代码：`frontend/src/**`
- 当前未提交 UI 改动：执行前逐项审查

### 阶段输出

- 手机端 App Shell 布局。
- 登录/注册/首页/对话/总结/历史回放页面调整。
- 状态覆盖：Default / Loading / Empty / Error / Disabled / 录音中 / AI 回复中 / 总结生成中。
- 前端 build 通过。
- 小阶段本地 commits。
- 阶段开发记录更新到 `progress.md`。

### 阶段一小阶段拆解

| 编号 | 小阶段 | 输入 | 动作 | 产物 | 完成标准 | 提交要求 | 是否可并行 | 是否使用 Subagent |
|---|---|---|---|---|---|---|---|---|
| 1.1 | 工作区审计与分支准备 | 当前 dirty worktree | 审查现有 UI diff，确认纳入范围，建立实现分支 | 审计记录、干净 staged 范围 | 不混入 `talkmate.db` 和无关文件 | `docs: 记录UI实现前工作区审计` | 否 | 否 |
| 1.2 | App Shell 与全局布局约束 | UI-001 方案 | 建立手机容器、dvh、高度、安全区、底部操作规范 | App 容器和全局 CSS | 375/430 框架成立，无横向滚动 | `ui(app): 建立手机端App Shell布局` | 否 | 否 |
| 1.3 | 登录/注册 App 化 | Auth 页面 | 改启动页、输入区、底部主按钮、错误反馈 | `LoginPage`、`RegisterPage` | 登录/注册默认、错误、加载态完整 | `ui(auth): 调整登录注册为手机App流程` | 否 | 否 |
| 1.4 | 首页任务流 App 化 | Home/Scenario/History | 改今日任务、任务卡、历史列表、刷新入口 | `HomePage`、`ScenarioCard`、`ScenarioList`、`PracticeHistoryList` | 第一屏以任务开始为主，历史不喧宾夺主 | `ui(home): 调整首页为移动任务流` | 否 | 否 |
| 1.5 | 对话训练页 App 化 | Conversation/Message/Voice | 固定顶部任务栏、底部输入区、语音状态、只读回放 | `ConversationPage`、`MessageInput`、`MessageList`、`VoiceRecorder` | 单手可操作，训练态/回放态清楚 | `ui(conversation): 调整对话页为移动训练舱` | 否 | 否 |
| 1.6 | 总结页 App 化 | Summary 页面 | 首屏评分、问题摘要、复练 CTA、长内容分区 | `SummaryPage`、训练反馈辅助模块 | 反馈可扫读，CTA 明确 | `ui(summary): 调整总结页为移动训练报告` | 否 | 否 |
| 1.7 | 阶段一自查与构建 | 所有前端改动 | 运行 build，检查 staged 文件，更新进度 | 构建输出、开发记录 | build 通过，无无关 staged 文件 | `chore(ui): 完成手机端界面阶段自查` | 否 | 否 |

### 阶段一执行细节

#### 1.1 工作区审计与分支准备

- [ ] **Step 1: 确认当前分支与 dirty 文件**

Run:

```bash
git -C /home/user13/Desktop/talkmate status --short --branch
git -C /home/user13/Desktop/talkmate diff --stat
```

Expected:

- 能看到当前分支。
- 能看到前端 UI 改动、`talkmate.db`、`frontend/src/features/training/`。

- [ ] **Step 2: 记录纳入范围**

更新 `progress.md`，记录：

```text
阶段一执行前审计：
- 纳入：手机端 App Shell、Auth、Home、Conversation、Summary、History 相关 UI 改动。
- 暂不纳入：本地数据库 `talkmate.db`。
- 需谨慎：`frontend/src/features/training/` 仅保留 UI 反馈辅助，不引入新的后端契约。
```

- [ ] **Step 3: 建立实现分支**

Run:

```bash
git -C /home/user13/Desktop/talkmate switch -c feature/mobile-app-ui-shell
```

如果分支已存在：

```bash
git -C /home/user13/Desktop/talkmate switch feature/mobile-app-ui-shell
```

- [ ] **Step 4: 提交审计记录**

Run:

```bash
git -C /home/user13/Desktop/talkmate add progress.md task_plan.md findings.md
git -C /home/user13/Desktop/talkmate diff --cached --name-only
git -C /home/user13/Desktop/talkmate commit -m "docs(ui): 记录手机端界面实现前审计"
```

Expected staged files:

```text
progress.md
task_plan.md
findings.md
```

#### 1.2 App Shell 与全局布局约束

- [ ] **Step 1: 修改全局样式**

Modify:

- `frontend/src/index.css`

Required behavior:

- `html/body/#root` 支持 `min-height: 100%`。
- `body` 禁止横向滚动。
- 增加移动安全区 CSS 变量。

Target CSS:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  overflow-x: hidden;
  background: #f8fafc;
}

:root {
  --app-max-width: 430px;
  --app-safe-bottom: env(safe-area-inset-bottom, 0px);
}
```

- [ ] **Step 2: 创建或抽取 App Shell 组件**

Preferred create:

- `frontend/src/app/AppShell.tsx`

Target responsibility:

- 提供移动端最大宽度容器。
- 桌面端居中显示手机 App 画布。
- 页面可选择是否有底部固定操作区。

Target component:

```tsx
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export default function AppShell({ children, className = '' }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">
      <div className={`mx-auto min-h-dvh w-full max-w-[var(--app-max-width)] bg-white shadow-sm ${className}`}>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build 验证**

Run:

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

Expected:

```text
✓ built
```

- [ ] **Step 4: Commit**

Run:

```bash
git -C /home/user13/Desktop/talkmate add frontend/src/index.css frontend/src/app/AppShell.tsx
git -C /home/user13/Desktop/talkmate commit -m "ui(app): 建立手机端App Shell布局"
```

#### 1.3 登录/注册 App 化

Modify:

- `frontend/src/features/auth/LoginPage.tsx`
- `frontend/src/features/auth/RegisterPage.tsx`

Requirements:

- 使用 `AppShell`。
- 顶部品牌区不超过首屏 30%。
- 表单输入控件 `min-h-12`。
- 主按钮 `min-h-12`，靠近底部。
- 错误信息 `break-words`，贴近表单。
- 注册页避免长营销文案。

Validation:

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

Commit:

```bash
git -C /home/user13/Desktop/talkmate add frontend/src/features/auth/LoginPage.tsx frontend/src/features/auth/RegisterPage.tsx
git -C /home/user13/Desktop/talkmate commit -m "ui(auth): 调整登录注册为手机App流程"
```

#### 1.4 首页任务流 App 化

Modify:

- `frontend/src/app/HomePage.tsx`
- `frontend/src/app/NavBar.tsx`
- `frontend/src/features/scenario/ScenarioCard.tsx`
- `frontend/src/features/scenario/ScenarioList.tsx`
- `frontend/src/components/PracticeHistoryList.tsx`

Requirements:

- 首页第一屏优先展示“今日训练/推荐任务”。
- 5 个场景卡片纵向任务流展示。
- 历史记录紧凑列表，不使用桌面网格。
- 失败态必须有重试按钮。
- 空态必须给出下一步动作。

Validation:

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

Commit:

```bash
git -C /home/user13/Desktop/talkmate add frontend/src/app/HomePage.tsx frontend/src/app/NavBar.tsx frontend/src/features/scenario/ScenarioCard.tsx frontend/src/features/scenario/ScenarioList.tsx frontend/src/components/PracticeHistoryList.tsx
git -C /home/user13/Desktop/talkmate commit -m "ui(home): 调整首页为移动任务流"
```

#### 1.5 对话训练页 App 化

Modify:

- `frontend/src/app/ConversationPage.tsx`
- `frontend/src/features/conversation/MessageBubble.tsx`
- `frontend/src/features/conversation/MessageInput.tsx`
- `frontend/src/features/conversation/MessageList.tsx`
- `frontend/src/components/voice/VoiceRecorder.tsx`

Requirements:

- 顶部显示返回、任务名、轮次进度。
- 消息列表占据主要区域并独立滚动。
- 底部输入区固定，考虑 `var(--app-safe-bottom)`。
- 语音按钮状态清楚：默认、录音中、识别失败、不支持。
- 历史模式不显示输入区，并显示只读提示。

Validation:

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

Commit:

```bash
git -C /home/user13/Desktop/talkmate add frontend/src/app/ConversationPage.tsx frontend/src/features/conversation/MessageBubble.tsx frontend/src/features/conversation/MessageInput.tsx frontend/src/features/conversation/MessageList.tsx frontend/src/components/voice/VoiceRecorder.tsx
git -C /home/user13/Desktop/talkmate commit -m "ui(conversation): 调整对话页为移动训练舱"
```

#### 1.6 总结页 App 化

Modify:

- `frontend/src/pages/SummaryPage.tsx`
- `frontend/src/features/training/trainingDesign.ts` if retained

Requirements:

- 第一屏展示评分、任务完成度、主要问题标签。
- 纠错卡片分层清楚，长文本可换行。
- “复练”和“选择下一任务”作为明确 CTA。
- 不新增后端接口。

Validation:

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

Commit:

```bash
git -C /home/user13/Desktop/talkmate add frontend/src/pages/SummaryPage.tsx frontend/src/features/training/trainingDesign.ts
git -C /home/user13/Desktop/talkmate commit -m "ui(summary): 调整总结页为移动训练报告"
```

#### 1.7 阶段一自查与 PR

- [ ] **Step 1: 前端构建**

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

- [ ] **Step 2: 后端模块回归**

```bash
cd /home/user13/Desktop/talkmate/backend
./venv/bin/pytest app/modules/auth/tests/test_auth.py app/modules/scenario/tests/test_scenario.py app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py app/modules/ai_service/tests/test_ai_service.py -q
```

- [ ] **Step 3: Git 洁净度检查**

```bash
git -C /home/user13/Desktop/talkmate status --short
git -C /home/user13/Desktop/talkmate diff --cached --name-only
```

Expected:

- `talkmate.db` 不得 staged。
- `.env` 不得 staged。
- `dist`、`node_modules`、`venv` 不得 staged。

- [ ] **Step 4: 更新阶段记录并提交**

Modify:

- `progress.md`
- `docs/product/phase1-delivery.md` or new `docs/acceptance/` only if needed for stage report

Commit:

```bash
git -C /home/user13/Desktop/talkmate add progress.md
git -C /home/user13/Desktop/talkmate commit -m "chore(ui): 完成手机端界面阶段自查"
```

- [ ] **Step 5: 推送并创建 PR**

```bash
git -C /home/user13/Desktop/talkmate push -u origin feature/mobile-app-ui-shell
```

PR title:

```text
[开发实施] 手机端App化界面调整
```

PR must include:

- 阶段目标。
- 完成内容。
- 影响范围。
- 构建和测试证据。
- 风险：第二阶段仍需完整用户体验验证。

---

## 3. 阶段二：完整功能与用户体验测试

### 阶段目标

站在真实用户角度执行完整交互测试，覆盖功能完整性、移动体验、页面状态、语音交互、历史回放和总结路径。阶段二的目标是发现问题，不在本阶段直接修复生产代码。

### 阶段输入

- 阶段一 PR 分支或其本地实现分支。
- 已完成 UI 调整代码。
- 既有 E2E 测试：`tests/e2e/*.py`。
- UI 验收标准：`docs/uiux/UI-001-mobile-app-layout-adjustment-discussion.md`。

### 阶段输出

- 新增 E2E 用户旅程测试。
- 新增移动体验测试。
- 新增测试验证记录。
- 缺陷 Issue 清单。
- 截图证据目录。
- 大阶段验证 PR。

### 阶段二小阶段拆解

| 编号 | 小阶段 | 输入 | 动作 | 产物 | 完成标准 | 提交要求 | 是否可并行 | 是否使用 Subagent |
|---|---|---|---|---|---|---|---|---|
| 2.1 | 测试环境与启动脚本规范 | 现有服务启动方式 | 明确前后端启动、PID、日志、安全停止 | 测试运行说明 | 不使用宽匹配 kill | `test(env): 记录移动体验测试环境` | 否 | 否 |
| 2.2 | 完整用户旅程 E2E | Playwright | 新增注册到历史回放完整点击测试 | `test_mobile_full_journey_e2e.py` | 覆盖主流程和异常入口 | `test(e2e): 增加完整用户旅程测试` | 否 | 否 |
| 2.3 | 移动布局体验 E2E | Playwright | 新增多视口布局断言和截图 | `test_mobile_layout_e2e.py` | 375/390/430/768/1440 无横向滚动 | `test(e2e): 增加手机端布局体验测试` | 否 | 否 |
| 2.4 | 页面状态 E2E | Playwright | 覆盖 loading/empty/error/disabled/readonly | `test_mobile_states_e2e.py` | 核心状态可见且可操作 | `test(e2e): 增加页面状态覆盖测试` | 否 | 否 |
| 2.5 | 执行完整测试矩阵 | 阶段二测试 | 运行 build、pytest、E2E、截图 | 测试输出和证据 | 有完整结果记录 | `test(report): 记录手机端体验验证结果` | 否 | 否 |
| 2.6 | 缺陷登记 | 测试失败和体验问题 | 按 Issue 格式记录缺陷 | `docs/testing/issues-*.md` | 每个问题有复现步骤和优先级 | `docs(test): 记录手机端体验缺陷清单` | 否 | 否 |

### 阶段二测试用例设计

#### 2.2 完整用户旅程 E2E

Create:

- `tests/e2e/test_mobile_full_journey_e2e.py`

Core scenario:

1. 375x812 打开 `/register`。
2. 注册用户。
3. 登录。
4. 首页检查任务卡和历史空态。
5. 点击第一个场景任务。
6. 发送 10 轮文本消息。
7. 每轮检查用户消息、AI 消息、AI 回复中状态。
8. 点击结束训练。
9. 进入总结页。
10. 检查评分区、纠错区、建议区、下一步 CTA。
11. 返回首页。
12. 检查历史记录出现。
13. 点击历史记录进入回放。
14. 检查只读提示和消息数量。
15. 登出。

Required assertions:

- URL 路由正确。
- 关键按钮可点击。
- 消息数量符合预期。
- 没有水平滚动。
- 每个核心页面截图保存到 evidence 目录。

Run:

```bash
source /home/user13/playwright-env/bin/activate
E2E_BASE_URL=http://127.0.0.1:5173 E2E_API_BASE=http://127.0.0.1:8000 python3 /home/user13/Desktop/talkmate/tests/e2e/test_mobile_full_journey_e2e.py
```

#### 2.3 移动布局体验 E2E

Create:

- `tests/e2e/test_mobile_layout_e2e.py`

Viewport matrix:

```python
VIEWPORTS = [
    ("iphone-se-width", 375, 812),
    ("iphone-12-width", 390, 844),
    ("large-phone", 430, 932),
    ("tablet", 768, 1024),
    ("desktop", 1440, 900),
]
```

Pages:

- `/login`
- `/register`
- `/`
- `/conversation/:id`
- `/conversation/history/:conversationId`
- `/conversation/:conversationId/summary`

Assertions:

```python
has_horizontal_overflow = page.evaluate(
    "() => document.documentElement.scrollWidth > document.documentElement.clientWidth"
)
assert has_horizontal_overflow is False
```

Touch target check:

```python
small_targets = page.evaluate("""
() => Array.from(document.querySelectorAll('button, a, input, textarea'))
  .filter((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return rect.height > 0 && rect.height < 44;
  })
  .map((el) => ({ tag: el.tagName, text: el.textContent?.trim(), height: el.getBoundingClientRect().height }))
""")
assert small_targets == []
```

#### 2.4 页面状态 E2E

Create:

- `tests/e2e/test_mobile_states_e2e.py`

States to cover:

| 页面 | 状态 | 验证方式 |
|---|---|---|
| 登录 | 错误密码 | 输入错误密码，检查错误文案 |
| 注册 | 密码不一致 | 输入不一致密码，检查按钮禁用或错误提示 |
| 注册 | 验证码错误 | 输入 `0000`，检查错误文案 |
| 首页 | 历史空态 | 新用户登录后检查空态 |
| 首页 | 场景加载/错误 | 拦截 `/api/v1/scenarios` 返回 500 |
| 对话 | AI 回复中 | 点击发送后检查 loading 文案或状态 |
| 对话 | 语音录音中 | 注入 Web Speech mock，检查录音态 |
| 对话 | 历史只读 | 进入 `/conversation/history/:id`，检查无输入框 |
| 总结 | 未生成总结 | 直接 GET 未生成总结路由，检查空态或生成入口 |
| 总结 | 生成失败 | 拦截 summary POST 返回 500，检查重试入口 |

### 阶段二执行命令

#### 2.5.1 构建与后端回归

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
cd /home/user13/Desktop/talkmate/backend
./venv/bin/pytest app/modules/auth/tests/test_auth.py app/modules/scenario/tests/test_scenario.py app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py app/modules/ai_service/tests/test_ai_service.py -q
```

#### 2.5.2 启动服务

Backend:

```bash
cd /home/user13/Desktop/talkmate/backend
setsid env \
  DATABASE_URL="sqlite:///./talkmate.db" \
  JWT_SECRET="mobile-ui-e2e-secret" \
  CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" \
  REGISTER_CAPTCHA="1234" \
  /home/user13/Desktop/talkmate/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --app-dir /home/user13/Desktop/talkmate/backend \
  > /tmp/talkmate-backend-mobile-ui.log 2>&1 < /dev/null &
echo $! > /tmp/talkmate-backend-mobile-ui.pid
```

Frontend:

```bash
cd /home/user13/Desktop/talkmate/frontend
setsid env VITE_API_BASE_URL="http://127.0.0.1:8000" \
  npm run dev -- --host 0.0.0.0 --port 5173 \
  > /tmp/talkmate-frontend-mobile-ui.log 2>&1 < /dev/null &
echo $! > /tmp/talkmate-frontend-mobile-ui.pid
```

Stop services safely:

```bash
for pidfile in /tmp/talkmate-frontend-mobile-ui.pid /tmp/talkmate-backend-mobile-ui.pid; do
  if [ -s "$pidfile" ]; then
    pid=$(cat "$pidfile")
    cmd=$(ps -p "$pid" -o args= 2>/dev/null || true)
    case "$cmd" in
      *vite*|*npm*run*dev*|*uvicorn*app.main*)
        kill -TERM "$pid" 2>/dev/null || true
        ;;
      *)
        echo "Skip unknown process for $pidfile: $cmd"
        ;;
    esac
  fi
done
```

#### 2.5.3 E2E 测试执行

```bash
source /home/user13/playwright-env/bin/activate
cd /home/user13/Desktop/talkmate
E2E_BASE_URL=http://127.0.0.1:5173 E2E_API_BASE=http://127.0.0.1:8000 python3 tests/e2e/test_mobile_full_journey_e2e.py
E2E_BASE_URL=http://127.0.0.1:5173 E2E_API_BASE=http://127.0.0.1:8000 python3 tests/e2e/test_mobile_layout_e2e.py
E2E_BASE_URL=http://127.0.0.1:5173 E2E_API_BASE=http://127.0.0.1:8000 python3 tests/e2e/test_mobile_states_e2e.py
```

### 阶段二报告

Create:

- `docs/testing/TEST-001-mobile-app-ui-verification.md`
- `docs/testing/issues-mobile-app-ui.md`

Report must include:

- 验证对象。
- 验证范围。
- 验证环境。
- 用例矩阵。
- 通过/失败结果。
- 截图证据路径。
- 缺陷与复测状态。
- S5 门禁结论。

Commit:

```bash
git -C /home/user13/Desktop/talkmate add tests/e2e/test_mobile_full_journey_e2e.py tests/e2e/test_mobile_layout_e2e.py tests/e2e/test_mobile_states_e2e.py docs/testing/TEST-001-mobile-app-ui-verification.md docs/testing/issues-mobile-app-ui.md progress.md
git -C /home/user13/Desktop/talkmate commit -m "test(e2e): 完成手机端App体验验证"
```

PR title:

```text
[联调验证] 手机端App化体验验证
```

---

## 4. 阶段三：问题修复与定向复测循环

### 阶段目标

只修复第二阶段发现并记录的问题。每次修复一个小问题或一组强相关问题，修复后只运行相关定向测试，不做全量测试。每轮形成 fix commit 和复测记录。

### 阶段输入

- `docs/testing/issues-mobile-app-ui.md`
- 第二阶段失败用例。
- 第二阶段截图/日志证据。

### 阶段输出

- 修复 commit。
- 定向复测结果。
- Issue 状态更新。
- 必要时新增回归用例。

### 阶段三修复循环

每个 Issue 按以下流程执行：

| 步骤 | 动作 | 产物 |
|---|---|---|
| 3.x.1 | 读取 Issue 复现步骤、证据、影响范围 | 修复范围确认 |
| 3.x.2 | 定位相关文件 | 影响文件清单 |
| 3.x.3 | 编写或更新定向测试 | 失败用例或检查点 |
| 3.x.4 | 修改实现 | 最小修复代码 |
| 3.x.5 | 运行定向测试 | 测试输出 |
| 3.x.6 | 更新 Issue 复测记录 | Issue 状态 |
| 3.x.7 | 本地 commit | fix commit |

### 问题优先级

| 优先级 | 定义 | 处理要求 |
|---|---|---|
| P0 | 核心流程不可用，如无法登录、无法开始对话、无法生成总结 | 立即修复，PR 不可合并 |
| P1 | 手机端主体验明显受损，如底部输入被遮挡、按钮不可点、严重溢出 | 本阶段必须修复 |
| P2 | 局部体验问题，如文案不清、次要状态弱 | 可进入遗留问题，但需说明计划 |
| P3 | 视觉微调建议 | 不阻塞，可入后续迭代 |

### 定向复测规则

只测修复范围，但必须包含：

- 原失败路径复测。
- 直接相关页面状态。
- 修复影响的最小视口集合。

Examples:

- 修复登录页按钮遮挡：只跑 `test_mobile_layout_e2e.py` 中 `/login` 的 375/390/430 视口断言。
- 修复对话输入区遮挡：只跑对话页布局断言 + 发送一条消息 E2E。
- 修复总结页长文本溢出：只跑总结页 375/430 视口截图和无横向滚动断言。

### 阶段三提交格式

Commit examples:

```bash
git commit -m "fix(ui): 修复对话页底部输入区遮挡"
git commit -m "fix(ui): 修复总结页长文本溢出"
git commit -m "test(e2e): 增加登录页移动端按钮遮挡回归"
```

### 阶段三 PR

PR title:

```text
[缺陷修复] 修复手机端体验验证问题
```

PR description must include:

- 修复 Issue 列表。
- 每个 Issue 的复现证据。
- 每个 Issue 的修复说明。
- 每个 Issue 的定向复测命令和结果。
- 未修复遗留问题及原因。

---

## 5. 最终验收交付

### 5.1 S6 验收交付产物

Create:

- `docs/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md`

Content must include:

- 验收项总表。
- 阶段一实现清单。
- 阶段二测试证据。
- 阶段三修复清单。
- 遗留问题。
- 是否建议合并/上线。

### 5.2 最终门禁

S6 通过标准：

- 375/390/430 手机视口核心流程无阻塞。
- 注册登录、任务选择、对话、总结、历史回放全流程通过。
- P0/P1 问题全部关闭。
- P2/P3 问题有明确后续计划。
- 前端 build 通过。
- 后端模块测试通过。
- E2E 主流程通过。
- 验证证据可追踪。

### 5.3 阶段复盘

Create:

- `docs/retros/RETRO-001-mobile-app-ui-adjustment.md`

Content:

- 目标达成情况。
- 主要问题。
- 修复效率。
- 测试覆盖盲点。
- 后续改进项。

---

## 6. 执行顺序建议

1. 先完成阶段一 UI 实现，并本地小阶段 commits。
2. 阶段一完成后 push 远程并创建开发实施 PR。
3. 进入阶段二，新增并执行完整体验测试。
4. 阶段二只记录问题，不混入修复。
5. 阶段二完成后 push 远程并创建联调验证 PR，或将验证报告关联到阶段一 PR。
6. 进入阶段三，按 Issue 优先级逐项修复。
7. 每个修复小阶段本地 commit。
8. 阶段三完成后 push 远程并创建缺陷修复 PR。
9. P0/P1 清零后进入 S6 验收交付。

---

## 7. 自查清单

- [ ] 计划覆盖 UI 实现、完整测试、问题修复三阶段。
- [ ] 每个小阶段有目标、输入、动作、产物、完成标准、提交要求。
- [ ] 明确每个小阶段本地 commit。
- [ ] 明确每个大阶段远程 PR。
- [ ] 明确第二阶段测试不是接口测试，而是用户视角点击与交互测试。
- [ ] 明确第三阶段只做定向复测，不做全量测试。
- [ ] 明确禁止提交数据库、密钥、构建产物和缓存。
- [ ] 明确当前 dirty worktree 的保护策略。

