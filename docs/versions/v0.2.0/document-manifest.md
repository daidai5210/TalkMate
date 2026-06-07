# TalkMate v0.2.0 文档清单

> 路线：B | 目标版本：v0.2.0 | 更新日期：2026-06-07

## 文档状态总览

| 文档 | 路径 | 状态 | Owner | 上游依赖 | 下游被依赖 |
|---|---|---|---|---|---|
| 版本概要 | `version-brief.md` | confirmed | PM/FS | — | 所有 |
| 文档清单 | `document-manifest.md` | confirmed | PM/FS | — | 所有 |
| 旧文档盘点 | `legacy-doc-inventory.md` | confirmed | FS | v0.1.0 归档 | 需求确认 |
| 技术可行性评估 | `architecture/technical-feasibility.md` | confirmed | FS | PM 需求输入 | PRD、技术设计 |
| 需求确认报告 | `product/requirement-confirmation.md` | 待填充 | PM | 用户确认 | PRD |
| PRD | `product/prd.md` | 待填充 | PM | 需求确认 | 技术设计、QA |
| 范围优先级 | `product/scope-priority.md` | 待填充 | PM | PRD | 任务拆解 |
| 验收标准 | `product/acceptance-criteria.md` | 待填充 | PM | PRD | QA、验收 |
| 影响范围分析 | `product/change-impact-analysis.md` | 待填充 | PM/FS | 技术可行性 | 回归范围 |
| 功能设计 | `design/feature-design.md` | 待填充 | PM | PRD | 技术设计 |
| 技术设计 | `architecture/` | 待填充 | FS | 功能设计 | 任务拆解 |
| API/数据/权限审查 | `architecture/api-data-permission-review.md` | 待填充 | FS | 技术设计 | QA |
| 可测试性审查 | `qa/testability-review.md` | 待填充 | QA | PRD、技术设计 | 任务拆解 |
| 回归范围 | `qa/regression-scope.md` | 待填充 | QA | 影响分析 | 测试执行 |
| 任务拆解 | `planning/task-breakdown.md` | 待填充 | PM/FS | 技术设计、QA | 派发 |
| 派发排期 | `planning/dispatch-schedule.md` | 待填充 | PM | 任务拆解 | 开发 |
| 决策记录 | `decisions/risk-decision-log.md` | 待填充 | PM/FS | — | 版本关闭 |
| 版本关闭 | `version-closure.md` | 待填充 | PM | 所有 | — |

## 当前完成项

- [x] `version-brief.md` — 版本目标和范围确认
- [x] `legacy-doc-inventory.md` — 旧文档盘点（无 unknown 风险项）
- [x] `document-manifest.md` — 本文档
- [x] `architecture/technical-feasibility.md` — 技术可行性评估

## 下一步

1. PM 完成需求确认报告 `product/requirement-confirmation.md`
2. PM 编写 PRD `product/prd.md`
3. PM 确认 Q1-Q6 取舍后更新 `version-brief.md`
4. 全部确认态文档就绪后进入 DoR 门禁
