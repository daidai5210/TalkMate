# TalkMate 文档索引

> 本文档是 TalkMate 项目文档的入口索引，按版本归档所有项目文档。

## 项目简介

TalkMate — AI 英语口语练习搭档，提供场景对话、语音交互、AI 纠错反馈和个人成长追踪。

## 文档版本总览

| 版本 | 说明 | 状态 |
|---|---|---|
| [v0.1.0](versions/v0.1.0/) | MVP 设计与手机端 App 化（归档） | 已完成 |
| [v0.2.0](versions/v0.2.0/) | 中文母语错误画像 + 个性化复练闭环 | 可行性评估已完成，待 PM 需求确认 |

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
