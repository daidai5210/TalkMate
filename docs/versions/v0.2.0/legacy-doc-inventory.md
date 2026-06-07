# TalkMate v0.2.0 旧文档版本盘点

> 盘点日期：2026-06-07 | 盘点人：系统架构师
> 当前运行版本：v0.1.0 | 目标版本：v0.2.0

## 盘点结论

v0.1.0 所有文档已于 2026-06-07 完成版本化归档，存放于 `docs/versions/v0.1.0/`。旧项目无遗留的无版本文档。本次盘点无 unknown 风险项。

## 文档处理清单

### 可直接复用（reuse）

| 文档 | 版本路径 | 复用说明 |
|---|---|---|
| 技术选型 | `../v0.1.0/architecture/tech-stack.md` | 不变，v0.2.0 沿用 |
| AI prompt 设计 | `../v0.1.0/architecture/ai-prompt-design.md` | v0.2.0 在其基础上增强 |
| 数据库设计 | `../v0.1.0/database/schema.md` | v0.2.0 新增 user_error_profiles 表 |
| API 设计规范 | `../v0.1.0/api/api-design.md` | 格式不变，新增 2 个端点 |
| 部署文档 | `../v0.1.0/deployment/` | 沿用 Vercel + TiDB |
| MVP 范围 | `../v0.1.0/product/mvp-scope.md` | 了解已有功能边界 |

### 需迁移到当前版本（migrate）

无。当前版本仅做增量设计，跨版本参考文档通过 `../v0.1.0/` 路径引用。

### 仅供参考（reference）

| 文档 | 版本路径 | 参考场景 |
|---|---|---|
| 业务调研报告 | `../v0.1.0/product/business-research.md` | 用户画像、竞品分析（中文用户定制差异化） |
| Phase 1 交付说明 | `../v0.1.0/product/phase1-delivery.md` | 了解历史交付口径 |
| 交接文档 | `../v0.1.0/acceptance/HANDOFF-001-fullstack-takeover.md` | 新接手开发人员上下文恢复 |

### 废弃（deprecated）

无。

### 待判断（unknown）

无。

## 旧项目基线确认

| 维度 | v0.1.0 基线 |
|---|---|
| 代码版本 | commit `898bfbd` on `main` |
| 前端框架 | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 |
| 后端框架 | FastAPI 0.100+ + SQLAlchemy 2.0 + SQLite |
| AI 服务 | DeepSeek v4-flash（OpenAI 兼容协议） |
| 部署 | Vercel（前端静态 + 后端 Serverless）+ TiDB Cloud |
| 认证 | JWT（python-jose） |
| 已有功能 | 注册/登录、5 场景对话、STT/TTS、AI 回复、课后总结、练习记录 |
