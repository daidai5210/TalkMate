# TalkMate 文档迁移说明

> 本文档记录从"扁平 docs 目录 + 根目录散落"到"版本化 docs/versions/"的迁移过程。

## 迁移日期

2026-06-07

## 迁移原因

1. 项目根目录散落 `task_plan.md`、`findings.md`、`progress.md` 三个 LCP 阶段上下文文件，违背"根目录仅保留 README"的治理原则。
2. `docs/` 下所有文档平铺，无版本区分，无法区分"已归档的旧版本"和"当前工作版本"。
3. 缺少统一的文档清单和迁移说明，新接手开发人员难以定位文档。

## 迁移内容

### 根目录 → docs/versions/v0.1.0/

| 原路径 | 新路径 | 说明 |
|---|---|---|
| `task_plan.md` | `docs/versions/v0.1.0/task_plan.md` | LCP 阶段任务计划（T1~T21）|
| `findings.md` | `docs/versions/v0.1.0/findings.md` | 项目发现与审计记录 |
| `progress.md` | `docs/versions/v0.1.0/progress.md` | 逐步进度记录 |

### docs/ → docs/versions/v0.1.0/

`docs/` 下原有 16 个子目录中的所有文档，完整复制到 `docs/versions/v0.1.0/` 下对应的同名子目录中。

原有目录：`acceptance/`、`api/`、`architecture/`、`database/`、`deployment/`、`designs/`、`operations/`、`plans/`、`product/`、`qa-reports/`、`requirements/`、`retros/`、`reviews/`、`superpowers/`、`testing/`、`uiux/`

### 新增文件

| 文件 | 用途 |
|---|---|
| `docs/INDEX.md` | 项目文档总入口索引 |
| `docs/DOCUMENT_INVENTORY.md` | 完整文档清单（版本、用途、维护人）|
| `docs/MIGRATION.md` | 本文档，迁移说明 |
| `docs/versions/v0.2.0/README.md` | v0.2.0 入口说明 |

## 链接断裂处理

**注意：** 原有 `docs/INDEX.md` 和各个文档内部可能有交叉引用，指向旧路径（如 `docs/product/xxx.md`）。迁移后这些链接在 v0.1.0 归档中已改为以 `versions/v0.1.0/` 为前缀的相对路径。

涉及以下文件需要更新链接：
- 旧 `docs/INDEX.md` → 已重写为版本入口索引
- `docs/versions/v0.1.0/task_plan.md` → 内部路径引用
- `docs/versions/v0.1.0/findings.md` → 内部路径引用
- `docs/versions/v0.1.0/acceptance/HANDOFF-001-fullstack-takeover.md` → 内部路径引用

## 后续版本约定

1. 所有新文档统一放在 `docs/versions/<版本号>/` 下。
2. 根目录长期仅保留 `README.md`（说明项目是什么）。
3. `docs/INDEX.md` 作为总入口，每次发版时更新版本总览表。
4. `docs/DOCUMENT_INVENTORY.md` 随每次归档同步更新。
5. 跨版本参考的文档（如 `architecture/`、`api/`、`database/`）保留在归档版本中，后续版本在各自的 `versions/<ver>/` 下维护增量更新。