# TalkMate 文档清单

> 本文档列出项目所有文档的版本、用途、维护人信息，随每次归档更新。

## v0.1.0（MVP 设计与手机端 App 化）

### 根级上下文文件（LCP 阶段文件，原位于项目根目录）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/task_plan.md` | S1~S7 全阶段任务计划（含 T1~T21）| 全栈开发工程师 |
| `versions/v0.1.0/findings.md` | 项目发现、审计、核查记录 | 全栈开发工程师 |
| `versions/v0.1.0/progress.md` | 逐步进度记录（按时间戳）| 全栈开发工程师 |

### product（产品）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/product/project-brief.md` | 项目启动卡、目标定义 | 产品经理 |
| `versions/v0.1.0/product/mvp-scope.md` | MVP 范围、不做事项、验收标准 | 产品经理 |
| `versions/v0.1.0/product/business-research.md` | 业务调研与竞品分析 | 产品经理 |
| `versions/v0.1.0/product/phase1-tasks.md` | Phase 1 任务拆解（T-001~T-008）| 全栈开发工程师 |
| `versions/v0.1.0/product/phase1-delivery.md` | Phase 1 交付说明 | 全栈开发工程师 |

### architecture（架构）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/architecture/tech-stack.md` | 技术选型与架构说明 | 系统架构师 |
| `versions/v0.1.0/architecture/ui-ux-design.md` | 基础 UI/UX 设计规范 | 前端开发工程师 |
| `versions/v0.1.0/architecture/ai-prompt-design.md` | AI 提示词设计 | 后端开发工程师 |

### api（API）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/api/api-design.md` | API 设计规范总览 | 系统架构师 |
| `versions/v0.1.0/api/auth.md` | 认证模块 API | 后端开发工程师 |
| `versions/v0.1.0/api/conversations.md` | 对话模块 API | 后端开发工程师 |
| `versions/v0.1.0/api/scenarios.md` | 场景模块 API | 后端开发工程师 |

### database（数据库）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/database/schema.md` | 数据库表结构设计 | 系统架构师 |

### requirements / designs / plans（S1/S2/S3 标准三文档）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/requirements/REQ-001-mvp-and-mobile-app-ui.md` | MVP 与手机端 App 化需求补档 | 前端开发工程师 |
| `versions/v0.1.0/designs/DESIGN-001-mvp-and-mobile-app-ui.md` | MVP 与手机端 App 化方案设计 | 前端开发工程师 |
| `versions/v0.1.0/plans/PLAN-001-mvp-and-mobile-app-ui.md` | MVP 与手机端 App 化任务分解 | 前端开发工程师 |

### uiux / superpowers（UI/UX 方案与执行计划）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/uiux/UI-001-mobile-app-layout-adjustment-discussion.md` | 手机端 App 化方案讨论稿 | 前端开发工程师 |
| `versions/v0.1.0/uiux/UI-DESIGN-v2.md` | UI 设计规范 v2 | 前端开发工程师 |
| `versions/v0.1.0/superpowers/plans/2026-06-05-mobile-app-ui-three-phase-plan.md` | 三阶段执行计划 | 前端开发工程师 |
| `versions/v0.1.0/superpowers/plans/2026-06-05-t007-practice-history.md` | T007 练习历史计划 | 前端开发工程师 |
| `versions/v0.1.0/superpowers/plans/2026-06-05-t008-responsive-states.md` | T008 响应式状态计划 | 前端开发工程师 |
| `versions/v0.1.0/superpowers/plans/2026-06-06-vercel-tidbcloud-deployment.md` | Vercel + TiDB 部署计划 | 系统架构师 |

### acceptance / reviews / retros（验收/审查/复盘）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/acceptance/ACCEPT-001-mobile-app-ui-adjustment.md` | 手机端 App 化 S6 验收交付记录 | 前端开发工程师 |
| `versions/v0.1.0/acceptance/HANDOFF-001-fullstack-takeover.md` | 全栈开发 S6 交接文档 | 全栈开发工程师 |
| `versions/v0.1.0/reviews/CR-001-mobile-app-ui-adjustment.md` | PR 前代码审查报告 | 前端开发工程师 |
| `versions/v0.1.0/retros/RETRO-001-mobile-app-ui-adjustment.md` | 手机端 App 化 S7 阶段复盘 | 前端开发工程师 |
| `versions/v0.1.0/retros/RETRO-002-mobile-app-frp-deployment.md` | FRP 公网部署 S7 复盘 | 全栈开发工程师 |

### testing / qa-reports（测试与 QA）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/testing/TEST-001-mobile-app-ui-verification.md` | 手机端 App 化验证报告 | 前端开发工程师 |
| `versions/v0.1.0/testing/issues-mobile-app-ui.md` | MUI-ISSUE-001 问题清单 | 前端开发工程师 |
| `versions/v0.1.0/qa-reports/t-001-e2e-verification.md` | T-001 认证模块 E2E 验证 | 测试运维 |
| `versions/v0.1.0/qa-reports/t-002-e2e-verification.md` | T-002 场景模块 E2E 验证 | 测试运维 |
| `versions/v0.1.0/qa-reports/t-003-e2e-verification.md` | T-003 对话模块 E2E 验证 | 测试运维 |
| `versions/v0.1.0/qa-reports/t-004-e2e-verification.md` | T-004 总结模块 E2E 验证 | 测试运维 |

### deployment / operations（部署与运维）

| 文件 | 用途 | 维护人 |
|---|---|---|
| `versions/v0.1.0/deployment/vercel-tidbcloud.md` | Vercel + TiDB Cloud 部署说明 | 系统架构师 |
| `versions/v0.1.0/deployment/vercel-tidb-ca.md` | Vercel + TiDB CA 证书部署说明 | 系统架构师 |
| `versions/v0.1.0/operations/deployment-runbook.md` | 部署运维手册 | 系统架构师 |

## v0.2.0（中文母语错误画像 + 个性化复练闭环）

| 文件 | 用途 | 维护人 | 状态 |
|---|---|---|---|
| `versions/v0.2.0/README.md` | v0.2.0 入口与阶段说明 | 全栈开发工程师 | ✅ |
| `versions/v0.2.0/version-brief.md` | 版本目标、范围、队长确认卡点 | PM / 系统架构师 | ✅ |
| `versions/v0.2.0/document-manifest.md` | 版本文档清单与状态 | PM / 系统架构师 | ✅ |
| `versions/v0.2.0/legacy-doc-inventory.md` | 旧文档版本盘点 | 系统架构师 | ✅ |
| `versions/v0.2.0/architecture/technical-feasibility.md` | 技术可行性评估 | 系统架构师 | ✅ |
| `versions/v0.2.0/product/requirement-confirmation.md` | 需求确认报告 | 产品经理 | 待填充 |
| `versions/v0.2.0/product/prd.md` | 产品需求文档 | 产品经理 | 待填充 |
| `versions/v0.2.0/product/scope-priority.md` | 范围优先级 | 产品经理 | 待填充 |
| `versions/v0.2.0/product/acceptance-criteria.md` | 验收标准 | 产品经理 | 待填充 |
| `versions/v0.2.0/product/change-impact-analysis.md` | 影响范围分析 | PM / 系统架构师 | 待填充 |
| `versions/v0.2.0/design/feature-design.md` | 功能设计 | 产品经理 | 待填充 |
| `versions/v0.2.0/architecture/` | 技术设计（API/数据/权限） | 系统架构师 | 待填充 |
| `versions/v0.2.0/qa/testability-review.md` | 可测试性审查 | 测试运维 | 待填充 |
| `versions/v0.2.0/qa/regression-scope.md` | 回归范围 | 测试运维 | 待填充 |
| `versions/v0.2.0/planning/task-breakdown.md` | 任务拆解 | PM / 系统架构师 | 待填充 |
| `versions/v0.2.0/decisions/risk-decision-log.md` | 决策记录 | PM / 系统架构师 | 待填充 |
| `versions/v0.2.0/version-closure.md` | 版本关闭记录 | PM | 待填充 |
