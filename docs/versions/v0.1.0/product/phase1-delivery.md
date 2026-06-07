# Phase 1 / MVP 技术交付说明

> 版本：v0.8.0  
> 日期：2026-06-05  
> 范围：TalkMate MVP v2.0 / Phase 1 开发任务 T-001 ~ T-008 全部通过验收  
> 状态：开发完成，等待 PM 阶段验收与后续决策

---

## 一、本阶段完成范围

| 任务 | 主题 | 关键交付 |
|------|------|----------|
| T-001 | 项目结构 + auth 模块 | backend 骨架 / 注册登录 / JWT / 前端 login+register |
| T-002 | 场景管理 | 场景列表接口 / 前端场景卡片 / 入口页 |
| T-003 | 对话会话 | 创建对话 / 发送消息 / 拉取历史 / 主页+对话页 |
| T-004 | AI 集成 | DeepSeek OpenAI-compatible / 超时降级 / 占位→真实 AI |
| T-005 | 语音 | 麦克风 STT 录音 / TTS 朗读 / 浏览器 Web Speech |
| T-006 | 课后总结 | 总结模型/接口/页 / 详细纠错 / 改进建议 / 词汇 / 评分 |
| T-007 | 练习记录 + 对话回溯 | 历史列表 API / 首页历史区 / 只读回溯 / 总结入口 |
| T-008 | 响应式 + 4 状态 | 375/768/1440 视口 / 每页 Default/Loading/Empty/Error |

---

## 二、核心接口

所有接口遵循 [`./api-design.md`](./api/api-design.md) 统一响应格式（code/message/data）与错误码。

- 认证：`POST /api/v1/auth/register`、`POST /api/v1/auth/login`、`POST /api/v1/auth/logout`
- 场景：`GET /api/v1/scenarios`
- 对话：`POST /api/v1/conversations`、`GET /api/v1/conversations`、`GET /api/v1/conversations/:id`、`POST /api/v1/conversations/:id/messages`
- 总结：`GET /api/v1/conversations/:id/summary`（空返回 3003）、`POST /api/v1/conversations/:id/summary`
- 健康：`GET /api/health`

详见：
- [`./api/auth.md`](./api/auth.md)
- [`./api/scenarios.md`](./api/scenarios.md)
- [`./api/conversations.md`](./api/conversations.md)

---

## 三、核心页面

- `/login`、`/register`：登录注册
- `/`：场景列表 + 历史练习记录
- `/conversation/:scenarioId`：新建对话 + 麦克风/朗读入口
- `/conversation/history/:conversationId`：只读回溯
- `/conversation/:conversationId/summary`：课后总结

实际文件位于 `frontend/src/app/`（HomePage、ConversationPage、router）与 `frontend/src/pages/SummaryPage.tsx`。

---

## 四、测试命令与结果

### Backend
```bash
cd /home/user13/Desktop/talkmate/backend
./venv/bin/pytest app/modules/conversation/tests/test_conversation.py \
  app/modules/summary/tests/test_summary.py -q
```
**结果**：19 passed, 43 warnings（含 `crypt` 与 `jose` 库的过时 API 警告，不影响功能）。

### Frontend
```bash
npm --prefix /home/user13/Desktop/talkmate/frontend run build
```
**结果**：tsc + vite build 全部通过。

### API smoke（T-001~T-007 主流程）
```python
# 覆盖：注册、登录、scenarios、conversations 空/非空、发送消息含 AI 回复、
#      对话详情消息拉取、生成总结、总结后历史 has_summary=true + summary_score。
# 全部步骤返回 code=0，AI 回复非空。
```

### 多视口 UI smoke（T-008）
```js
// Playwright Chromium headless
// 18 个 page-viewport 组合（login/register/home/conversation/history/summary × 375/768/1440）
// 全部 hasHorizontalOverflow = false，登录按钮 44px 触控安全。
```

### 服务健康
```bash
# 172.17.0.5:5173 → HTTP 200
# 172.17.0.5:8000/api/health → 200 {"status":"ok","service":"talkmate-backend"}
```

---

## 五、运行方式

- 前端：`cd frontend && npm run dev -- --host 0.0.0.0 --port 5173`
  - PID 文件：`/tmp/talkmate-frontend-dev.pid`
  - 日志：`/tmp/talkmate-frontend-dev.log`
- 后端：`cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
  - PID 文件：`/tmp/talkmate-backend.pid`
  - 日志：`/tmp/talkmate-backend.log`
- 停止时按 PID 文件精确停止，禁止 `pkill -f` / `killall` 等宽匹配。

---

## 六、已知观察项

| 编号 | 观察 | 影响 | 处置 |
|------|------|------|------|
| OBS-001 | AI 首次冷启动 1440 视口偶发 10s 超时，后续重试正常 | 非阻塞 | 进入性能/稳定性观察清单；后续可考虑提高 `DEEPSEEK_TIMEOUT`、加客户端重试/降级提示 |
| OBS-002 | `passlib` 与 `jose` 库使用过时的 `crypt` / `datetime.utcnow()` | 仅 deprecation warning | 不影响功能，后续升级 Python/库时统一处理 |
| OBS-003 | 本地 SQLite `talkmate.db` 多次因 smoke 写入修改 | 仅本地 | 明确不提交；不参与跨环境数据迁移 |

---

## 七、未提交 / 不提交产物确认

通过 `git status` 确认：
- ✅ `talkmate.db` 修改未 stage（本地运行库，不提交）
- ✅ 无 `.env` / `.team-secrets.md` / 任何密钥被 stage
- ✅ 无 `frontend/dist` / `node_modules` / `venv` 被 stage
- ✅ 当前 staged 文件为空

---

## 八、不在本阶段范围

- 深色模式、主题切换、大规模视觉重设计
- 筛选/排序、进步曲线、数据导出
- 独立记录管理页
- Phase 1 以外新功能

如需进入这些工作，请 PM 派发新任务后启动。

---

## 九、关联文档

- 需求：`docs/product/phase1-tasks.md`、`docs/product/mvp-scope.md`
- 架构：`docs/architecture/tech-stack.md`、`docs/architecture/ai-prompt-design.md`、`docs/architecture/ui-ux-design.md`
- API：`docs/api/api-design.md`、`docs/api/auth.md`、`docs/api/scenarios.md`、`docs/api/conversations.md`
- 数据库：`docs/database/schema.md`
- 实施计划：`docs/superpowers/plans/2026-06-05-t007-practice-history.md`、`docs/superpowers/plans/2026-06-05-t008-responsive-states.md`
- QA 报告：`docs/qa-reports/` 各 T-001 ~ T-003 / T-004 报告

---

## 更新记录

| 日期 | 更新 | 作者 |
|------|------|------|
| 2026-06-05 | 初始版本：Phase 1 全部任务验收通过 | 全栈开发工程师 |
