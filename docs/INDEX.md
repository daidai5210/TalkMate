# TalkMate 文档索引

| 编号 | 文档 | 阶段 | 状态 | 关联任务 | 更新时间 |
|---|---|---|---|---|---|
| REQ-BASE | `docs/product/project-brief.md` | S1 | 已确认 | 项目启动 | 2026-06-05 |
| REQ-MVP | `docs/product/mvp-scope.md` | S1 | 已确认 | MVP 范围 | 2026-06-05 |
| REQ-001 | `docs/requirements/REQ-001-mvp-and-mobile-app-ui.md` | S1 | 已完成 | MVP 与手机端 App 化需求补档 | 2026-06-06 |
| DESIGN-BASE | `docs/architecture/ui-ux-design.md` | S2 | 已确认 | 基础 UIUX | 2026-06-05 |
| DESIGN-001 | `docs/designs/DESIGN-001-mvp-and-mobile-app-ui.md` | S2 | 已完成 | MVP 与手机端 App 化方案补档 | 2026-06-06 |
| UI-001 | `docs/uiux/UI-001-mobile-app-layout-adjustment-discussion.md` | S2 | 已完成 | 手机端 App 化方案 | 2026-06-05 |
| PLAN-001 | `docs/plans/PLAN-001-mvp-and-mobile-app-ui.md` | S3 | 已完成 | MVP 与手机端 App 化任务补档 | 2026-06-06 |
| PLAN-MUI-001 | `docs/superpowers/plans/2026-06-05-mobile-app-ui-three-phase-plan.md` | S3 | 已完成 | 手机端 App 化三阶段执行计划 | 2026-06-05 |
| TEST-001 | `docs/testing/TEST-001-mobile-app-ui-verification.md` | S5 | 已通过 | 手机端 App 化验证 | 2026-06-05 |
| ISSUE-001 | `docs/testing/issues-mobile-app-ui.md` | S5 | 已完成 | MUI-ISSUE-001 | 2026-06-05 |
| CR-001 | `docs/reviews/CR-001-mobile-app-ui-adjustment.md` | 评审 | 已通过 | PR 前代码审查 | 2026-06-05 |
| ACCEPT-001 | `docs/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md` | S6 | 待验收 | 手机端 App 化交付 | 2026-06-05 |
| HANDOFF-001 | `docs/acceptance/HANDOFF-001-fullstack-takeover.md` | S6 | 已更新 | 全栈开发接手 / UI 依赖修复 / 本地产物忽略策略 | 2026-06-06 |
| RETRO-001 | `docs/retros/RETRO-001-mobile-app-ui-adjustment.md` | S7 | 已完成 | 手机端 App 化复盘 | 2026-06-05 |
| RETRO-002 | `docs/retros/RETRO-002-mobile-app-frp-deployment.md` | S7 | 待归档 | FRP 公网部署与 PR 合并复盘 | 2026-06-06 |

## 说明

- `task_plan.md`、`findings.md`、`progress.md` 为 LCP 阶段上下文文件，位于项目根目录。
- `RETRO-002` 当前在本地工作区未跟踪，建议评审后纳入文档提交。
- 队长已确认本地产物不要上传；根 `.gitignore` 已忽略虚拟环境、日志、PID、SQLite、FRP 本地配置与 `evidence/`。
- 当前 UI 方向已确认接受；`lucide-react` 已补入前端依赖清单，作为 App 化 UI 构建所需依赖。
