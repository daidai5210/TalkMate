# HANDOFF-001 TalkMate 全栈开发交接文档

文档名称：TalkMate 全栈开发交接文档
所属阶段：S6 验收交付 / 交接移交
创建时间：2026-06-06T04:47:23Z
当前状态：已更新
适用任务：新全栈开发人员接手 TalkMate 项目
输入来源：`task_plan.md`、`findings.md`、`progress.md`、Git 状态、项目代码、S5/S6/S7 阶段文档
负责人/执行方：LCP 单 Agent
关联文档：`docs/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md`、`docs/testing/TEST-001-mobile-app-ui-verification.md`、`docs/reviews/CR-001-mobile-app-ui-adjustment.md`、`docs/retros/RETRO-001-mobile-app-ui-adjustment.md`

## 1. 接手摘要

TalkMate 是一个 AI 英语口语陪练 MVP，目标是让用户通过浏览器完成“注册登录 -> 选择场景 -> 英语对话训练 -> 查看纠错与总结 -> 回看练习记录”的闭环。

当前主线状态：

| 项目 | 当前事实 |
|---|---|
| 项目路径 | `/home/user13/Desktop/talkmate` |
| Git 远程 | `git@github.com:daidai5210/TalkMate.git` |
| 当前分支 | `main` |
| 主线提交 | `898bfbd fix(profile): ProfilePage 对接真实后端 API 并新增 Phase 2 E2E 测试` |
| 远程同步 | `main` 与 `origin/main` 均在 `898bfbd` |
| 最近完成事项 | Phase 2 个人中心真实 API 对接已合入主线；队长已确认接受当前 UI 方向 |
| 当前交接阶段 | S4 修复验证 / S6 交接文档补全 |
| 当前工作区 | 非完全洁净，存在已确认纳入的 UI 改动、依赖修复、忽略规则和文档补全项，详见第 8 节 |

重要说明：早期 `task_plan.md/progress.md` 曾记录“远程 PR 因 SSH publickey 阻塞”。根据 2026-06-06 的 Git 状态，该阻塞已经解除，PR #2 已合并到 `main`。2026-06-06T10:56:05Z 最新核查显示 `main` / `origin/main` 已推进到 `898bfbd`，接手时请以当前 Git 状态和本交接文档为准。

## 2. 我们在做什么

### 2.1 产品目标

TalkMate MVP 验证用户能否通过浏览器与 AI 完成场景化英语口语对话练习，并获得纠错反馈和课后总结。

核心用户：

| 用户 | 场景 | 目标 |
|---|---|---|
| 大学生 | 面试英语练习 | 提升面试问答表达 |
| 职场人士 | 英文会议练习 | 降低会议发言压力 |
| 出国旅游人群 | 旅行沟通练习 | 出行前口语突击 |

### 2.2 当前完成范围

已完成并合入主线的范围：

- 用户注册、登录、登出、JWT 会话保持。
- 首页场景选择，包含 5 个种子场景。
- 对话创建、消息保存、AI 回复、历史回放。
- 浏览器 Web Speech API 语音输入与 TTS 播放。
- 总结生成与纠错反馈展示。
- 首页练习记录列表。
- 手机端 App 化 UI：App Shell、登录/注册、首页任务流、对话训练舱、总结报告。
- 抽卡跟练、用户统计、个人中心真实后端 API 对接。
- Playwright E2E：完整旅程、多视口布局、页面状态覆盖。
- S6 验收交付记录、S7 复盘、PR 前代码审查记录。

暂不做或后续再做：

- Native App / 小程序。
- 多语种。
- 流式实时语音。
- 独立历史管理页、社区、课程商城、教师端。
- 生产 HTTPS、完整监控告警、正式发布流水线。

## 3. 技术架构

### 3.1 后端

| 项目 | 内容 |
|---|---|
| 框架 | FastAPI |
| 数据库 | SQLite，本地文件 `talkmate.db` |
| ORM | SQLAlchemy |
| 鉴权 | JWT + bcrypt |
| AI 服务 | DeepSeek API 封装，配置来自环境变量 |
| 入口 | `backend/app/main.py` |
| 健康检查 | `GET /api/health` |

后端模块地图：

| 模块 | 路径 | 说明 |
|---|---|---|
| auth | `backend/app/modules/auth/` | 注册、登录、用户、JWT |
| scenario | `backend/app/modules/scenario/` | 场景模型、种子数据、场景接口 |
| conversation | `backend/app/modules/conversation/` | 对话、消息、历史记录 |
| summary | `backend/app/modules/summary/` | 总结生成与读取 |
| ai_service | `backend/app/modules/ai_service/` | DeepSeek client、prompt、降级逻辑 |
| db | `backend/app/db/` | 数据库初始化与 session |
| core | `backend/app/core/` | 配置与安全工具 |

### 3.2 前端

| 项目 | 内容 |
|---|---|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS |
| 路由 | react-router-dom |
| 状态 | Zustand |
| HTTP | Axios |
| 图标 | lucide-react |
| 语音能力 | Web Speech API / SpeechSynthesis |
| 入口 | `frontend/src/main.tsx` |

前端模块地图：

| 模块 | 路径 | 说明 |
|---|---|---|
| App Shell | `frontend/src/app/AppShell.tsx`、`frontend/src/app/AppLayout.tsx` | 手机端外壳、安全区、底部 Tab 导航和全局布局 |
| 路由 | `frontend/src/app/router.tsx` | 登录、注册、`/app/home`、`/app/scenarios`、个人中心、对话、总结路由 |
| 首页 | `frontend/src/pages/NewHomePage.tsx` | 今日任务、训练入口、统计和练习记录入口 |
| 对话页 | `frontend/src/app/ConversationPage.tsx` | 训练对话、历史只读、总结入口 |
| 登录注册 | `frontend/src/features/auth/` | Auth 页面与 auth service |
| 场景 | `frontend/src/features/scenario/` | 场景列表、卡片、store |
| 对话 | `frontend/src/features/conversation/` | 消息组件、service、store |
| 总结 | `frontend/src/pages/SummaryPage.tsx` | 训练报告展示 |
| 场景页 | `frontend/src/pages/ScenariosPage.tsx` | App 化场景列表入口 |
| 抽卡跟练 | `frontend/src/pages/PracticeCardPage.tsx` | 随机练习卡片跟练 |
| 个人中心 | `frontend/src/pages/ProfilePage.tsx` | 真实后端 API 统计、成就、热力图和趋势展示 |
| 训练辅助 | `frontend/src/features/training/trainingDesign.ts` | 纯前端 UI 展示辅助逻辑 |
| API client | `frontend/src/services/api.ts` | Axios baseURL、token 注入、401 跳转 |

## 4. 关键文档

| 文档 | 用途 | 状态 |
|---|---|---|
| `docs/requirements/REQ-001-mvp-and-mobile-app-ui.md` | S1 标准需求澄清记录 | 已完成 |
| `docs/designs/DESIGN-001-mvp-and-mobile-app-ui.md` | S2 标准方案文档 | 已完成 |
| `docs/plans/PLAN-001-mvp-and-mobile-app-ui.md` | S3 标准任务拆解计划 | 已完成 |
| `docs/product/project-brief.md` | 项目启动背景 | 已存在 |
| `docs/product/mvp-scope.md` | MVP 范围、验收标准、不做事项 | 已存在 |
| `docs/product/phase1-delivery.md` | Phase 1 技术交付说明 | 已存在 |
| `docs/uiux/UI-001-mobile-app-layout-adjustment-discussion.md` | 手机端 App 化 UI 方案 | 已完成 |
| `docs/superpowers/plans/2026-06-05-mobile-app-ui-three-phase-plan.md` | 三阶段实施计划 | 已完成 |
| `docs/testing/TEST-001-mobile-app-ui-verification.md` | 手机端 App 化验证报告 | 已通过 |
| `docs/testing/issues-mobile-app-ui.md` | 测试缺陷记录 | 已完成 |
| `docs/reviews/CR-001-mobile-app-ui-adjustment.md` | PR 前代码审查记录 | 有条件通过，条件已随 PR 合并解除 |
| `docs/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md` | S6 验收交付记录 | 待队长/PM 验收 |
| `docs/retros/RETRO-001-mobile-app-ui-adjustment.md` | 手机端 App 化阶段复盘 | 已完成 |
| `docs/retros/RETRO-002-mobile-app-frp-deployment.md` | FRP 公网部署和 PR 合并复盘 | 本地未跟踪，需决定是否提交 |
| `task_plan.md`、`findings.md`、`progress.md` | LCP 阶段上下文 | 已维护 |

注意：`docs/product/phase1-tasks.md` 中部分任务状态历史上未同步为完成；若后续整理交付材料，建议按 Git 历史和验收报告更新该文档，避免与 `phase1-delivery.md` 继续冲突。

## 5. 当前验证证据

已记录通过的验证：

| 验证项 | 命令或用例 | 结果 |
|---|---|---|
| 前端构建 | `npm --prefix /home/user13/Desktop/talkmate/frontend run build` | 2026-06-06T10:56 前复测通过 |
| 后端模块测试 | `backend/venv/bin/pytest app/modules/auth/tests/test_auth.py app/modules/scenario/tests/test_scenario.py app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py app/modules/ai_service/tests/test_ai_service.py -q` | 2026-06-06T10:56 前复测：`41 passed, 47 warnings` |
| 依赖修复回归 | 前端 build 曾因 `lucide-react` 未声明失败；补充依赖后复跑 build | 已通过 |
| npm audit | `npm --prefix frontend audit --audit-level=moderate` | 发现 Vite/esbuild moderate 漏洞，官方建议需破坏性升级到 `vite@8.0.16`，本次未强制升级 |
| Phase 2 E2E | `venv_e2e/bin/python tests/e2e/test_phase2_e2e.py`，服务地址 `http://127.0.0.1:4180` | 2026-06-06T10:56 后复测通过 |
| 完整旅程 E2E | `tests/e2e/test_mobile_full_journey_e2e.py` | 通过 |
| 页面状态 E2E | `tests/e2e/test_mobile_states_e2e.py` | 通过 |
| 多视口布局 E2E | `tests/e2e/test_mobile_layout_e2e.py` | 修复 MUI-ISSUE-001 后通过 |
| PR 前代码审查 | `docs/reviews/CR-001-mobile-app-ui-adjustment.md` | 有条件通过 |

截图证据：

- 历史记录中提到 `evidence/2026-06-05-mobile-app-ui/`，用于完整旅程、布局、状态截图。
- `evidence/` 已按队长确认加入忽略规则，不作为仓库提交物；截图证据如需保留，走本地或外部归档。

已知 warning：

- 后端测试存在 `passlib` 的 `crypt` 过时警告。
- `jose` 或项目代码中有 `datetime.utcnow()` 过时警告。
- 上述 warning 未阻塞当前 MVP 验收，但建议后续技术债处理。

## 6. 本地启动方式

### 6.1 后端

```bash
cd /home/user13/Desktop/talkmate/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

后端默认访问：

- API 根：`http://localhost:8000`
- Swagger：`http://localhost:8000/docs`
- 健康检查：`http://localhost:8000/api/health`

配置注意：

- `DATABASE_URL=sqlite:///./talkmate.db`
- `REGISTER_CAPTCHA=1234`
- `DEEPSEEK_API_KEY` 不应写入仓库。真实 key 需要通过环境变量或安全配置注入。
- CORS 默认允许 `http://localhost:5173,http://127.0.0.1:5173`。

### 6.2 前端

```bash
cd /home/user13/Desktop/talkmate/frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0
```

前端依赖注意：当前 UI 使用 `lucide-react`，必须保留在 `frontend/package.json` 与 `frontend/package-lock.json` 中，否则 TypeScript 构建会出现 `TS2307 Cannot find module 'lucide-react'`。

前端默认配置：

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 6.3 常用验证命令

前端构建：

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

后端模块测试：

```bash
cd /home/user13/Desktop/talkmate/backend
./venv/bin/pytest app/modules/auth/tests/test_auth.py app/modules/scenario/tests/test_scenario.py app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py app/modules/ai_service/tests/test_ai_service.py -q
```

E2E 测试需先启动后端和前端服务，再运行 `tests/e2e/` 下的 Playwright 脚本。历史执行中曾创建临时 Playwright 环境 `/tmp/talkmate-playwright-env` 并安装 Chromium 运行依赖。

## 7. Git 与分支状态

2026-06-06T10:56:05Z 核查结果：

当前非洁净项概览：

```text
## main...origin/main
 M .gitignore
 M findings.md
 M frontend/package-lock.json
 M frontend/package.json
 M frontend/src/app/AppLayout.tsx
 M frontend/src/app/router.tsx
 M frontend/src/features/auth/LoginPage.tsx
 M frontend/src/features/auth/RegisterPage.tsx
 M frontend/src/index.css
 M frontend/src/pages/NewHomePage.tsx
 M frontend/src/pages/PracticeCardPage.tsx
 M frontend/src/pages/ProfilePage.tsx
 M frontend/tailwind.config.js
 M progress.md
 M talkmate.db
 M task_plan.md
 M tests/e2e/test_phase2_e2e.py
?? docs/INDEX.md
?? docs/acceptance/HANDOFF-001-fullstack-takeover.md
?? docs/designs/
?? docs/plans/
?? docs/requirements/
?? docs/retros/RETRO-002-mobile-app-frp-deployment.md
?? docs/uiux/UI-DESIGN-v2.md
?? frontend/public/
?? frontend/src/components/ui/
?? frontend/src/pages/ScenariosPage.tsx
```

近期提交：

```text
898bfbd (HEAD -> main, origin/main) fix(profile): ProfilePage 对接真实后端 API 并新增 Phase 2 E2E 测试
1e650a7 feat(summary): 总结页优化+热力图/趋势图接口+AI prompt增强（T2-014~T2-016）
14b6dad fix(conversation): 对话页改为纯语音输入+TTS自动播放Bug修复（T2-009+T2-010）
331ef77 ui(practice): 长按语音按钮组件+抽卡跟练页（T2-006+T2-008）
273cba2 feat(practice): 抽卡数据模型+种子数据+AI评分接口（T2-005+T2-007）
```

重要分支：

| 分支 | 状态 | 说明 |
|---|---|---|
| `main` | 与 `origin/main` 同步 | 当前接手基线，最新为 `898bfbd` |
| `feature/mobile-app-ui-shell` | 存在本地和远程 | 手机端 App 化开发分支，已通过 PR #2 合入主线 |
| 多个 `feat/talkmate-*` | 多数为历史分支 | 后续可按 GitHub PR 合并状态清理 |

## 8. 当前未提交项处理建议

| 项 | 状态 | 处理建议 |
|---|---|---|
| `talkmate.db` | tracked 文件有本地二进制变更 | 本地运行数据，不要提交。根 `.gitignore` 已补 `*.db`，但已跟踪文件仍需提交前人工排除 |
| `.gitignore` | 已修改 | 已补充虚拟环境、日志、PID、SQLite、FRP 本地配置、`evidence/` 等本地产物忽略规则 |
| `frontend/package.json`、`frontend/package-lock.json` | 已修改 | 补充 `lucide-react` 依赖，修复当前 UI 构建失败 |
| App 化 UI 文件 | 已修改/新增 | 队长已确认接受当前 UI 方向，需随下一次代码提交纳入；已通过前端 build |
| `docs/retros/RETRO-002-mobile-app-frp-deployment.md` | 未跟踪 | 内容记录 FRP 公网部署、SSH 权限修复、PR #2 合并和后续行动。建议评审后纳入文档提交 |
| `evidence/` | 已被忽略 | 队长确认本地产物不要上传，截图证据保留本地或外部归档 |
| 本交接文档与 `docs/INDEX.md` | 新增/更新 | 建议纳入后续文档提交 |

不要执行宽匹配删除或进程终止命令。处理本地文件前先用 `git status --short --branch`、`git diff --stat`、`git ls-files` 确认归属。

## 9. 已知风险与待办

| 编号 | 风险或待办 | 影响 | 建议下一步 |
|---|---|---|---|
| R1 | `talkmate.db` 仍有本地变更且已被 Git 跟踪 | 容易误入提交，污染代码交付 | 保持不提交；后续如要彻底治理需单独执行 `git rm --cached talkmate.db` 并评估历史影响 |
| R2 | 当前 UI 方向已确认但尚未提交 | 后续接手需区分业务代码、依赖和本地产物 | 提交前按文件清单 staged，不使用 `git add .` |
| R3 | `RETRO-002` 未归档，`evidence/` 已本地忽略 | 后续接手者可能遗漏公网部署经验或截图证据 | 复盘文档可提交；截图证据走外部归档或本地保留 |
| R4 | `phase1-tasks.md` 与实际交付状态不一致 | 阶段状态容易误判 | 按主线提交和验收报告补齐状态同步 |
| R5 | 后端 deprecation warnings | 不阻塞当前功能，但会形成技术债 | 建立后续技术债任务 |
| R6 | HTTP 公网环境下浏览器语音能力受限 | Web Speech API 在非安全上下文可能受浏览器限制 | 正式环境使用 HTTPS；当前不要用代码主动禁用录音 |
| R7 | GitHub 历史 feature 分支较多 | 分支列表混乱 | 按已合并 PR 清理远程分支 |
| R8 | DeepSeek key 管理依赖外部安全注入 | 本地启动真实 AI 能力需要密钥 | 不在 `.env` 或聊天中明文传输 key |
| R9 | `npm audit` 有 2 个 moderate 漏洞 | 来自 Vite/esbuild dev server 风险 | 不执行破坏性 `--force` 升级；后续建技术债评估 Vite 大版本升级 |

## 10. 接手后建议工作顺序

1. 确认本地基线：
   - `cd /home/user13/Desktop/talkmate`
   - `git status --short --branch`
   - `git log --oneline --decorate -5`

2. 处理文档归档：
   - 评审并决定是否提交 `docs/retros/RETRO-002-mobile-app-frp-deployment.md`。
   - 保留本交接文档和 `docs/INDEX.md`。
   - `evidence/` 已按队长确认加入忽略规则，不作为仓库提交物。
   - 当前 App 化 UI 方向已确认接受，提交时应纳入依赖、UI 代码和文档，排除 `talkmate.db`。

3. 复跑核心验证：
   - 前端 build。
   - 后端模块 pytest。
   - 如要做 UI 验收或继续改 UI，复跑 `tests/e2e/test_mobile_full_journey_e2e.py`、`tests/e2e/test_mobile_states_e2e.py`、`tests/e2e/test_mobile_layout_e2e.py`。

4. 补齐阶段状态：
   - 同步 `docs/product/phase1-tasks.md` 的任务状态。
   - 根据是否接受 `RETRO-002`，补充 S7 复盘归档。
   - S1/S2/S3 标准入口已补齐到 `docs/requirements/`、`docs/designs/`、`docs/plans/`，后续优先从这三份文档恢复上下文。

5. 开始新需求前回到 S1：
   - 先写需求澄清和验收口径。
   - 涉及 UI 时沿用 `docs/uiux/UI-001-mobile-app-layout-adjustment-discussion.md` 的手机 App Shell 方向。
   - 新功能不得直接在主线开发，按规范开 feature 分支、小阶段提交、测试闭环。

## 11. S6 交接门禁结论

门禁结论：有条件通过。

判断依据：

- 接手目标、项目路径、当前阶段、主线状态、关键代码模块、验证证据和遗留风险已写明。
- 交付物可定位，核心文档和测试报告均已列出。
- 当前主线已包含手机端 App 化和 Phase 2 个人中心 API 对接工作，历史 PR 阻塞已解除。
- 队长已确认接受当前 UI 方向，并确认本地产物忽略、不上传。
- 本次补充 `lucide-react` 后前端构建通过，后端模块测试通过，Phase 2 E2E 通过。
- 条件项为本地工作区仍有未提交代码和已跟踪数据库变更，后续提交必须精确 staged，避免 `talkmate.db` 和本地运行产物混入。

是否允许进入下一阶段：允许进入接手开发准备；如要启动新功能，必须从 S1 需求理解开始。
