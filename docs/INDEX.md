# TalkMate 文档索引

> 本文档是 TalkMate 项目文档的入口索引，按版本归档所有项目文档。

## 项目简介

TalkMate — AI 英语口语练习搭档，提供场景对话、语音交互、AI 纠错反馈和个人成长追踪。

## 文档版本总览

| 版本 | 说明 | 状态 |
|---|---|---|
| [v0.1.0](versions/v0.1.0/) | MVP 设计与手机端 App 化（归档） | 已完成 |
| [v0.2.0](versions/v0.2.0/) | 中文母语错误画像 + 个性化复练闭环 | 已完成 |

## 速查入口

- **需求**：见对应版本 `versions/<ver>/requirements/`
- **架构**：见 `versions/v0.1.0/architecture/`（跨版本参考）
- **API**：见 `versions/v0.1.0/api/`（跨版本参考）
- **数据库**：见 `versions/v0.1.0/database/`（跨版本参考）
- **部署**：见 `versions/v0.1.0/deployment/`
- **文档清单**：见 [DOCUMENT_INVENTORY.md](DOCUMENT_INVENTORY.md)
- **迁移说明**：见 [MIGRATION.md](MIGRATION.md)

## 根目录文件约定

- `README.md` — 项目简介（长期保留在根目录）
- `docs/` — 所有项目文档的唯一下属目录
- LCP 上下文文件（`task_plan.md`、`findings.md`、`progress.md`）— 位于 `docs/` 下，归档副本在 `docs/versions/v0.1.0/`
- `.dev-constraints.md` — 开发约束（已在 .gitignore 中排除，不随 git 追踪）

## v0.1.0 文档清单

| 编号 | 文档 | 阶段 | 状态 | 关联任务 | 更新时间 |
|---|---|---|---|---|---|
| REQ-BASE | `versions/v0.1.0/product/project-brief.md` | S1 | 已确认 | 项目启动 | 2026-06-05 |
| REQ-MVP | `versions/v0.1.0/product/mvp-scope.md` | S1 | 已确认 | MVP 范围 | 2026-06-05 |
| REQ-001 | `versions/v0.1.0/requirements/REQ-001-mvp-and-mobile-app-ui.md` | S1 | 已完成 | MVP 与手机端 App 化需求补档 | 2026-06-06 |
| DESIGN-BASE | `versions/v0.1.0/architecture/ui-ux-design.md` | S2 | 已确认 | 基础 UIUX | 2026-06-05 |
| DESIGN-001 | `versions/v0.1.0/designs/DESIGN-001-mvp-and-mobile-app-ui.md` | S2 | 已完成 | MVP 与手机端 App 化方案补档 | 2026-06-06 |
| UI-001 | `versions/v0.1.0/uiux/UI-001-mobile-app-layout-adjustment-discussion.md` | S2 | 已完成 | 手机端 App 化方案 | 2026-06-05 |
| PLAN-001 | `versions/v0.1.0/plans/PLAN-001-mvp-and-mobile-app-ui.md` | S3 | 已完成 | MVP 与手机端 App 化任务补档 | 2026-06-06 |
| PLAN-MUI-001 | `versions/v0.1.0/superpowers/plans/2026-06-05-mobile-app-ui-three-phase-plan.md` | S3 | 已完成 | 手机端 App 化三阶段执行计划 | 2026-06-05 |
| TEST-001 | `versions/v0.1.0/testing/TEST-001-mobile-app-ui-verification.md` | S5 | 已通过 | 手机端 App 化验证 | 2026-06-05 |
| ISSUE-001 | `versions/v0.1.0/testing/issues-mobile-app-ui.md` | S5 | 已完成 | MUI-ISSUE-001 | 2026-06-05 |
| CR-001 | `versions/v0.1.0/reviews/CR-001-mobile-app-ui-adjustment.md` | 评审 | 已通过 | PR 前代码审查 | 2026-06-05 |
| ACCEPT-001 | `versions/v0.1.0/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md` | S6 | 已通过 | 手机端 App 化交付 | 2026-06-05 |
| HANDOFF-001 | `versions/v0.1.0/acceptance/HANDOFF-001-fullstack-takeover.md` | S6 | 已更新 | 全栈开发接手 / UI 依赖修复 / 本地产物忽略策略 | 2026-06-06 |
| RETRO-001 | `versions/v0.1.0/retros/RETRO-001-mobile-app-ui-adjustment.md` | S7 | 已完成 | 手机端 App 化复盘 | 2026-06-05 |
| RETRO-002 | `versions/v0.1.0/retros/RETRO-002-mobile-app-frp-deployment.md` | S7 | 已归档 | FRP 公网部署与 PR 合并复盘 | 2026-06-06 |

## v0.2.0 文档清单

| 编号 | 文档 | 阶段 | 状态 | 关联任务 | 更新时间 |
|---|---|---|---|---|---|
| PRD-001 | `versions/v0.2.0/product/prd.md` | S1 | 已确认 | 中文母语错误画像需求 | 2026-06-07 |
| DESIGN-002 | `versions/v0.2.0/architecture/tech-design.md` | S2 | 已完成 | v0.2.0 技术设计 | 2026-06-07 |
| ACCEPT-002 | `versions/v0.2.0/qa/acceptance-report.md` | QA | 已通过 | v0.2.0 验收报告 | 2026-06-07 |

## 说明

- 所有文档按版本归档在 `docs/versions/<version>/` 目录下。
- LCP 上下文文件（`task_plan.md`、`findings.md`、`progress.md`）为阶段工作文件，位于 `docs/` 下。
- 根 `.gitignore` 已忽略虚拟环境、日志、PID、SQLite、FRP 本地配置与 `evidence/`。
