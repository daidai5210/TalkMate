# 任务计划：talkmate 项目阶段评估与开发进入计划

## 目标

依据 `/home/user13/Desktop/lcp-team-docs` 开发指导规范，判断 talkmate 项目当前所处阶段、输入是否充分、应产出内容、门禁状态和下一步开发动作。

## 当前阶段

S4/S5/S6/S7 闭环完成：阶段一 UI 实现、阶段二完整功能与用户体验测试、阶段三 MUI-ISSUE-001 定向修复与复测、S6 验收交付记录、S7 阶段复盘均已完成。远程 PR 待补，阻塞原因为当前环境缺少可用 GitHub SSH publickey 权限。

## 阶段任务

| 编号 | 任务 | 状态 | 完成标准 |
|---|---|---|---|
| T1 | 读取 LCP 核心规范与专项规范 | complete | 明确阶段识别、门禁、Git、测试、项目结构要求 |
| T2 | 盘点 talkmate 项目文档和代码现场 | complete | 明确现有需求、方案、计划、验证证据和未提交改动 |
| T3 | 判断当前项目阶段 | complete | 输出阶段判断依据、输入充分性和门禁结论 |
| T4 | 给出下一步开发动作 | complete | 输出可执行任务、风险、待确认事项和是否可进入开发 |
| T5 | 提交 S2 UIUX 方案讨论产物 | complete | 本地 Git commit 完成，且不混入业务代码和数据库 |
| T6 | 制定三阶段实施计划 | complete | 明确 UI 实现、完整体验测试、问题修复循环和提交/PR 策略 |
| T7 | 阶段一 1.1 工作区审计与分支准备 | complete | 明确 dirty worktree 纳入/排除范围，创建实现分支并提交审计记录 |
| T8 | 阶段一 1.2 App Shell 与全局布局约束 | complete | 建立手机端 App Shell 和安全区布局变量，前端 build 通过 |
| T9 | 阶段一 1.3 登录/注册 App 化 | complete | 登录/注册改为手机 App 启动流程，前端 build 通过 |
| T10 | 阶段一 1.4 首页任务流 App 化 | complete | 首页改为移动任务流，前端 build 通过 |
| T11 | 阶段一 1.5 对话训练页 App 化 | complete | 对话页改为移动训练舱，前端 build 通过 |
| T12 | 阶段一 1.6 总结页 App 化 | complete | 总结页改为移动训练报告，前端 build 通过 |
| T13 | 阶段一 1.7 阶段自查与构建 | complete | 前端 build 通过，后端模块测试通过，Git 洁净度检查仅剩不提交的 `talkmate.db` |
| T14 | 阶段二 完整功能与用户体验测试 | complete | 完整旅程、页面状态、多视口布局测试已执行并形成测试报告 |
| T15 | 阶段三 MUI-ISSUE-001 修复与定向复测 | complete | 修复触控目标过小问题，多视口布局 E2E 复测通过 |
| T16 | S6 验收交付记录 | complete | 交付清单、验收项、验证证据、遗留风险已记录 |
| T17 | S7 阶段复盘 | complete | 阶段复盘、问题经验、后续动作已记录 |
| T18 | 远程推送与 PR | blocked | SSH host key 已补齐；`git push` 失败于 `Permission denied (publickey)` |

## 风险

- 当前 talkmate 工作区仍有未提交的本地运行数据 `talkmate.db` 和本地截图证据 `evidence/`，按阶段记录不纳入代码提交。
- 远程 PR 暂未创建，当前环境缺少可用 GitHub SSH 私钥或仓库访问权限。
- `docs/product/phase1-tasks.md` 与 `docs/product/phase1-delivery.md` 存在状态冲突，需要以代码、Git 历史和验证结果复核真实阶段。

## 阶段判断

- 手机端 App 化 UI 调整：S4/S5/S6/S7 已闭环完成，具备队长/PM 验收基础。
- 当前未完成项：远程分支 push 与 PR 创建，阻塞原因为 GitHub SSH publickey 权限缺失。

## 验证证据

- 前端构建：`npm --prefix /home/user13/Desktop/talkmate/frontend run build`，结果通过。
- 后端模块测试：`./venv/bin/pytest app/modules/auth/tests/test_auth.py app/modules/scenario/tests/test_scenario.py app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py app/modules/ai_service/tests/test_ai_service.py -q`，结果 `41 passed, 47 warnings`。

## 三阶段计划产物

- S2 方案讨论稿：`docs/uiux/UI-001-mobile-app-layout-adjustment-discussion.md`
- S3 三阶段实施计划：`docs/superpowers/plans/2026-06-05-mobile-app-ui-three-phase-plan.md`

## 阶段一执行审计

- 实现分支：`feature/mobile-app-ui-shell`
- 纳入阶段一：`frontend/src/app/*`、`frontend/src/features/auth/*`、`frontend/src/features/scenario/*`、`frontend/src/features/conversation/*`、`frontend/src/components/PracticeHistoryList.tsx`、`frontend/src/components/voice/VoiceRecorder.tsx`、`frontend/src/pages/SummaryPage.tsx`、`frontend/src/features/training/trainingDesign.ts`
- 不纳入提交：`talkmate.db`
- 约束：`frontend/src/features/training/` 仅作为前端 UI 反馈辅助，不新增后端接口、不扩大业务契约。

## 阶段一验证证据

- 前端构建：`npm --prefix /home/user13/Desktop/talkmate/frontend run build`，结果通过。
- 后端模块测试：`./venv/bin/pytest app/modules/auth/tests/test_auth.py app/modules/scenario/tests/test_scenario.py app/modules/conversation/tests/test_conversation.py app/modules/summary/tests/test_summary.py app/modules/ai_service/tests/test_ai_service.py -q`，结果 `41 passed, 47 warnings`。
- Git 洁净度：业务代码已全部提交，仅剩 `talkmate.db` 本地运行数据变更，按计划不提交。

## 阶段二/三验证证据

- 完整用户旅程 E2E：`tests/e2e/test_mobile_full_journey_e2e.py`，结果通过。
- 页面状态 E2E：`tests/e2e/test_mobile_states_e2e.py`，结果通过。
- 多视口布局 E2E：首次发现 MUI-ISSUE-001；修复后 `tests/e2e/test_mobile_layout_e2e.py` 通过。
- 测试报告：`docs/testing/TEST-001-mobile-app-ui-verification.md`
- Issue 清单：`docs/testing/issues-mobile-app-ui.md`

## 验收交付与复盘证据

- S6 验收交付记录：`docs/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md`
- S7 阶段复盘：`docs/retros/RETRO-001-mobile-app-ui-adjustment.md`
- PR 前 Code Review：`docs/reviews/CR-001-mobile-app-ui-adjustment.md`
- 飞书截图证据发送记录：`progress.md` 2026-06-05T23:28:00Z 条目。
- 远程推送最新阻塞：SSH host key 已补齐；`git push -u origin feature/mobile-app-ui-shell` 返回 `Permission denied (publickey)`。
