# 任务计划：talkmate 项目阶段评估与开发进入计划

## 目标

依据 `/home/user13/Desktop/lcp-team-docs` 开发指导规范，判断 talkmate 项目当前所处阶段、输入是否充分、应产出内容、门禁状态和下一步开发动作。

## 当前阶段

S4 开发实施阶段：正在执行三阶段计划中的阶段一“手机端 App 化 UI 实现”，当前小阶段为 1.1 工作区审计与分支准备。

## 阶段任务

| 编号 | 任务 | 状态 | 完成标准 |
|---|---|---|---|
| T1 | 读取 LCP 核心规范与专项规范 | complete | 明确阶段识别、门禁、Git、测试、项目结构要求 |
| T2 | 盘点 talkmate 项目文档和代码现场 | complete | 明确现有需求、方案、计划、验证证据和未提交改动 |
| T3 | 判断当前项目阶段 | complete | 输出阶段判断依据、输入充分性和门禁结论 |
| T4 | 给出下一步开发动作 | complete | 输出可执行任务、风险、待确认事项和是否可进入开发 |
| T5 | 提交 S2 UIUX 方案讨论产物 | complete | 本地 Git commit 完成，且不混入业务代码和数据库 |
| T6 | 制定三阶段实施计划 | complete | 明确 UI 实现、完整体验测试、问题修复循环和提交/PR 策略 |
| T7 | 阶段一 1.1 工作区审计与分支准备 | in_progress | 明确 dirty worktree 纳入/排除范围，创建实现分支并提交审计记录 |

## 风险

- 当前 talkmate 工作区已有未提交改动，后续开发前需要保护既有改动并确认来源。
- 当前尚未确认用户希望继续执行的具体功能任务，不能直接进入新的 S4 开发实施。
- `docs/product/phase1-tasks.md` 与 `docs/product/phase1-delivery.md` 存在状态冲突，需要以代码、Git 历史和验证结果复核真实阶段。

## 阶段判断

- Phase 1 基线：已完成 S4 开发实施，具备进入 S5/S6 收敛的基础，但需要补齐验证证据与验收交付记录后才能进入产品验收结论。
- 当前未提交改动：属于未确认的新一轮产品/UI/训练体验扩展，应回到 S1/S2/S3 补齐需求、方案和任务计划，暂不应直接进入 S4 继续开发或提交。

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
