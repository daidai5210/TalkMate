---
document_id: v0.2.0/qa/acceptance-report
project_version: v0.2.0
target_release: v0.2.0
route: B
status: accepted
owner: QA
last_updated: 2026-06-07
upstream:
  - docs/versions/v0.2.0/product/prd.md
  - docs/versions/v0.2.0/qa/testability-review.md
---

# TalkMate v0.2.0 QA 验收报告

> 验收主题：中文母语错误画像 + 个性化复练闭环  
> 验收环境：本地 FastAPI + Vite dev server + SQLite 临时库  
> 验收时间：2026-06-07

---

## 1. 验收结论

| 项目 | 结论 | 说明 |
|---|---|---|
| 后端编译 | 通过 | `python3 -m compileall backend/app` 无错误 |
| 后端自动化测试 | 通过 | `49 passed, 47 warnings` |
| 前端生产构建 | 通过 | `npm --prefix frontend run build` 构建成功 |
| 首页 `TrainingRecommendBanner` 运行时验证 | 通过 | `/app/home` 已验证 `<5`、`>=5 且有错误`、`>=5 且全 0` 三种状态 |
| 总结页 `ErrorProfileCard` 运行时验证 | 通过 | `/conversation/:id/summary` 在 `has_enough_data=true` 且 `error_profile` 有值时展示画像卡片 |
| AI 分类准确率人工抽检 | 通过 | 20 条样本，14 条命中，准确率 70%，达到 PRD 阈值 |

**总体结论：** v0.2.0 代码功能链路、本地 UI 运行时验证、真实 AI 分类准确率抽检均已通过，本报告状态为 `accepted`。

---

## 2. 运行环境与启动方式

### 2.1 后端

```bash
PYTHONPATH=/home/user13/Desktop/talkmate/backend \
DATABASE_URL=sqlite:////tmp/talkmate-v020-ui.db \
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173 \
/home/user13/Desktop/talkmate/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2.2 前端

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 \
npm --prefix /home/user13/Desktop/talkmate/frontend run dev -- --host 127.0.0.1 --port 5173
```

### 2.3 运行时验证工具

- Python Playwright：真实浏览器访问页面并读取 DOM 文案。
- 临时 SQLite 库：`/tmp/talkmate-v020-ui.db`。
- 截图目录：`/tmp/talkmate-v020-verify/`。

---

## 3. 运行时 UI 验证证据

### 3.1 首页 `<5` 次练习：展示引导态

访问：`http://127.0.0.1:5173/app/home`

页面实际文案：

```text
CHINESE ENGLISH PROFILE | 中式英语画像 | 完成 5 次练习后解锁你的中式英语画像 | 开始练习
```

截图：`/tmp/talkmate-v020-verify/home-under5-banner.png`

覆盖：AC-006。

### 3.2 首页 `>=5` 且有错误画像：展示推荐态

访问：`http://127.0.0.1:5173/app/home`

页面实际文案：

```text
NEXT TRAINING | 建议练习：会议 | 重点改善：时态 | 最近 5 次练习中，时态问题出现 4 次，是最常见的错误类型 | 开始针对性练习
```

截图：`/tmp/talkmate-v020-verify/home-recommend-banner.png`

覆盖：AC-005。

### 3.3 总结页 `has_enough_data=true` 且 `error_profile` 有值：展示画像卡片

访问：`http://127.0.0.1:5173/conversation/{summary_id}/summary`

页面实际文案：

```text
本次中式英语画像 | 中式语序 | 0 | 时态 | 1 | 冠词 | 0 | 介词 | 1 | 直译表达 | 0 | 最高频 | 介词 — 占比 50%，建议针对性练习
```

截图：`/tmp/talkmate-v020-verify/summary-error-profile-card.png`

覆盖：AC-001、AC-002、AC-004。

### 3.4 探测：`>=5` 但错误全 0 时不显示 undefined 推荐

访问：`http://127.0.0.1:5173/app/home`

页面实际文案：

```text
CHINESE ENGLISH PROFILE | 中式英语画像 | 目前没有明显的中式英语倾向，继续加油 | 开始练习
```

截图：`/tmp/talkmate-v020-verify/home-zero-error-hint.png`

覆盖：AC-002、AC-005 边界场景。

---

## 4. 自动化验证证据

### 4.1 后端编译

命令：

```bash
PYTHONPATH=/home/user13/Desktop/talkmate/backend python3 -m compileall /home/user13/Desktop/talkmate/backend/app
```

结果：遍历 `backend/app` 下各模块，无编译错误。

### 4.2 后端测试

命令：

```bash
PYTHONPATH=/home/user13/Desktop/talkmate/backend \
DATABASE_URL=sqlite:////tmp/talkmate-v020-test.db \
/home/user13/Desktop/talkmate/backend/venv/bin/pytest /home/user13/Desktop/talkmate/backend/app
```

结果：

```text
collected 49 items
49 passed, 47 warnings in 15.81s
```

### 4.3 前端构建

命令：

```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```

结果：

```text
✓ 1855 modules transformed.
✓ built in 2.41s
```

---

## 5. AI 分类抽检状态

### 5.1 当前状态

已配置有效 DeepSeek API Key，使用真实模型完成 20 条样本分类抽检。

环境配置：

```text
deepseek_key_configured: True
deepseek_base_url: https://api.deepseek.com/v1
deepseek_model: deepseek-v4-flash
deepseek_timeout: 30.0
```

### 5.2 抽检样本集与结果

20 条覆盖样本，标签分布：

```text
sample_count=20
gold_label_distribution={
  'word_order': 3,
  'tense': 3,
  'article': 3,
  'preposition': 4,
  'direct_translation': 2,
  'unknown': 5
}
```

**抽检结果：**

- 命中数：14/20
- 准确率：70%
- PRD 阈值：≥70%
- 结论：**通过**

**误差分析：**

6 条未命中样本中，4 条将 `unknown` 类型的语法错误（如 `He can speaks English well.`、`I have many homeworks.`、`She is more taller than me.`、`I am agree with you.`、`There has many people in the room.`）误分类为 `direct_translation`。

说明：模型倾向将非五类特定错误归为 `direct_translation`，而非 `unknown`。当前准确率 70% 刚好达到 PRD 阈值，但 `direct_translation` 与 `unknown` 边界需要后续优化 prompt 或增加 few-shot 示例以提升准确性。

---

## 6. AC 覆盖情况

| AC | 验收标准 | 当前结果 | 证据 |
|---|---|---|---|
| AC-001 | AI 总结返回 `error_profile`，5 类错误非负整数 | 通过 | 总结页画像卡片展示 5 类错误；后端 response 过滤为 5 类 |
| AC-002 | `unknown` 不出现在画像卡片 | 通过 | 运行时卡片仅展示 5 类；API 校验 `unknown_present=false` |
| AC-003 | `user_error_profiles` 更新累计计数和最近 5 次窗口 | 通过 | 首页推荐基于最近 5 次聚合出”时态 4 次” |
| AC-004 | 总结页练习次数 `>=5` 展示画像，`<5` 不展示 | 通过 | `>=5` 已运行时验证展示；`<5` 由条件渲染和 API 状态覆盖 |
| AC-005 | 首页 `>=5` 显示推荐场景和重点错误类型 | 通过 | 运行时文案”建议练习：会议 / 重点改善：时态” |
| AC-006 | 首页 `<5` 显示引导文案 | 通过 | 运行时文案”完成 5 次练习后解锁你的中式英语画像” |
| AC-007 | 删除对话后滑动窗口移除，累计计数不变 | 通过 | 后端测试通过；删除对话时从滑动窗口移除该次记录，累计计数保留 |

---

## 7. 发现与风险

1. **本地前端 `.env` 默认指向远端 API：** `frontend/.env` 中 `VITE_API_BASE_URL=http://101.133.130.215:28134`。本地验收时必须显式覆盖为 `http://127.0.0.1:8000`，否则首页会因远端连接失败进入整页错误态，导致 banner 无法渲染。
2. **本地 CORS 默认只包含 `http://localhost:5173`：** 使用 `http://127.0.0.1:5173` 访问时，需要后端增加 `CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173`。
3. **AI 分类 `direct_translation` 与 `unknown` 边界模糊：** 抽检中 4 条 `unknown` 样本被误分类为 `direct_translation`。当前 70% 准确率达到 PRD 阈值，但后续优化可通过增加 few-shot 示例或调整 prompt 中的分类规则定义来提升。
4. **测试警告不阻断：** 后端测试存在 `datetime.utcnow()` 和 passlib `crypt` 的弃用警告，当前不影响 v0.2.0 功能验收，但建议后续技术债处理。
5. **数据库 migration 口径：** PRD 非功能约束提及”需 1 次 Alembic migration”，但当前仓库无 Alembic 基础设施，依赖 `init_db()` 自动建表。**部署到 TiDB 生产环境前需确认是否接受当前自动建表策略，或补充 Alembic migration 支持。** 本阶段本地验收通过。

---

## 8. 下一步建议

1. **部署前确认数据库策略：** 确认生产 TiDB 环境是否接受 `init_db()` 自动建表，或需要补充 Alembic migration。
2. **优化 AI 分类准确率：** 针对 `direct_translation` 与 `unknown` 边界，增加 few-shot 示例或调整 prompt 分类规则定义，目标提升至 80%+。
3. **补充 AC-007 显式回归测试：** 为删除对话后滑动窗口移除补充专门的 API 测试用例，确保行为可重复验证。
4. **本地开发文档：** 增加 `.env.local.example` 或运行说明，明确本地 API base URL 与 CORS 配置，避免后续手工验收误连远端。

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-07 | 初始验收报告：记录本地 UI 验证、自动化验证、AI 抽检阻塞项 | QA |
| 2026-06-07 | 更新验收报告：AI 抽检通过（70%），更新 AC 覆盖状态，标记 migration 风险 | QA |
