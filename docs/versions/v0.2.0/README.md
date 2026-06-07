# TalkMate v0.2.0

> 下一版本的需求、设计、任务与验收入口。

## 版本状态

- **版本号**：v0.2.0
- **状态**：待规划
- **起始日期**：2026-06-07
- **基于版本**：v0.1.0（MVP 设计与手机端 App 化）

## 目录结构

| 目录 | 用途 | 状态 |
|---|---|---|
| `requirements/` | 需求文档 | 待填充 |
| `designs/` | 方案设计 | 待填充 |
| `plans/` | 任务拆解 | 待填充 |
| `tasks/` | 任务执行记录 | 待填充 |
| `acceptance/` | 验收交付 | 待填充 |
| `retros/` | 阶段复盘 | 待填充 |
| `testing/` | 测试记录 | 待填充 |
| `qa-reports/` | QA 报告 | 待填充 |

## 上下文恢复路径

接手本版本的开发人员按以下顺序恢复上下文：

1. 阅读 [v0.1.0 交接文档](../v0.1.0/acceptance/HANDOFF-001-fullstack-takeover.md)
2. 阅读 [v0.1.0 任务计划](../v0.1.0/task_plan.md)（了解已完成工作）
3. 阅读 [项目文档索引](../../INDEX.md)（了解全貌）
4. 阅读 [文档清单](../../DOCUMENT_INVENTORY.md)（按需查阅）

## 技术基线

- 前端：React + TypeScript + Vite + Tailwind CSS + shadcn/ui + lucide-react
- 后端：Python FastAPI + SQLAlchemy + SQLite（开发）/ TiDB（生产）
- 部署：Vercel（前端静态 + 后端 Serverless）+ TiDB Cloud
- 详见 [v0.1.0 技术栈文档](../v0.1.0/architecture/tech-stack.md)
