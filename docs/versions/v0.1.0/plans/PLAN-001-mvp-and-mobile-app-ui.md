# PLAN-001 TalkMate MVP 与手机端 App 化任务拆解计划

文档名称：TalkMate MVP 与手机端 App 化任务拆解计划
所属阶段：S3 任务规划
创建时间：2026-06-06
当前状态：已完成
适用任务：TalkMate MVP 交付与手机端 App 化 UI 调整
输入来源：`docs/product/phase1-tasks.md`、`docs/product/phase1-delivery.md`、`docs/superpowers/plans/2026-06-05-mobile-app-ui-three-phase-plan.md`、`progress.md`
负责人/执行方：LCP 单 Agent
关联文档：`docs/requirements/REQ-001-mvp-and-mobile-app-ui.md`、`docs/designs/DESIGN-001-mvp-and-mobile-app-ui.md`

## 1. 计划目标

- 让接手开发人员能从标准 `docs/plans/` 目录理解 TalkMate 已执行的任务拆解。
- 对齐 MVP 原始 T-001~T-008 任务与后续手机端 App 化三阶段计划。
- 明确已完成内容、验证证据和后续待办。

## 2. 任务范围

### 本次包含

- MVP Phase 1 功能闭环任务 T-001~T-008。
- 手机端 App 化 UI 调整三阶段任务。
- 测试、Issue 修复、交付、复盘和交接文档补齐。

### 本次不包含

- Native App、小程序、生产发布流水线。
- 清理历史远程 feature 分支。

## 3. MVP Phase 1 任务清单

| 编号 | 任务 | 说明 | 依赖 | 优先级 | 完成标准 | 当前状态 |
|---|---|---|---|---|---|---|
| T-001 | 项目结构 + 用户注册登录 | 前后端骨架、auth、JWT、登录注册页 | 无 | P0 | 能注册、登录、登出、刷新保持登录 | 已完成，见 `phase1-delivery.md` |
| T-002 | 场景选择页面 | 首页 5 个场景卡片和种子数据 | T-001 | P0 | 能浏览场景并点击创建对话 | 已完成 |
| T-003 | 对话页面文字模式 | 消息列表、文字输入、消息持久化 | T-002 | P0 | 能发送消息、AI 回复、刷新不丢失 | 已完成 |
| T-004 | AI 对话集成 | DeepSeek 封装、场景 prompt、超时降级 | T-003 | P0 | AI 回复与场景相关 | 已完成 |
| T-005 | 语音交互 | STT、TTS、录音入口 | T-004 | P0 | 语音转文字，AI 回复可播放 | 已完成 |
| T-006 | 纠错 + 课后总结 | 总结模型、接口、页面 | T-004 | P0 | 展示评分、纠错、词汇分析和建议 | 已完成 |
| T-007 | 练习记录 + 对话回溯 | 首页历史列表、只读回放、总结入口 | T-006 | P1 | 能回看完整对话和总结 | 已完成 |
| T-008 | 响应式 + 状态补齐 | 375-1440 响应式和页面状态 | T-007 | P0 | 无横向滚动，状态完整 | 已完成 |

说明：历史 `docs/product/phase1-tasks.md` 中状态仍为 pending，接手时应以 `docs/product/phase1-delivery.md`、Git 主线、测试报告和本计划为准。

## 4. 手机端 App 化三阶段任务清单

| 编号 | 任务 | 说明 | 依赖 | 优先级 | 完成标准 | 当前状态 |
|---|---|---|---|---|---|---|
| MUI-1.1 | 工作区审计与分支准备 | 审查 dirty worktree，确认纳入范围，建立分支 | S2 确认 | P0 | 不混入 `talkmate.db` 和无关文件 | 已完成 |
| MUI-1.2 | App Shell 与全局布局 | 手机容器、dvh、安全区、全局宽度 | MUI-1.1 | P0 | 375/430 框架成立，无横向滚动 | 已完成 |
| MUI-1.3 | 登录/注册 App 化 | 启动页式布局、输入和错误态 | MUI-1.2 | P0 | 登录注册默认/错误/加载态完整 | 已完成 |
| MUI-1.4 | 首页任务流 App 化 | 今日任务、任务卡、历史列表 | MUI-1.2 | P0 | 第一屏以训练任务为主 | 已完成 |
| MUI-1.5 | 对话训练页 App 化 | 顶部任务栏、消息区、底部输入、语音状态 | MUI-1.2 | P0 | 单手可操作，训练/回放态清楚 | 已完成 |
| MUI-1.6 | 总结页 App 化 | 评分首屏、问题摘要、复练 CTA | MUI-1.2 | P0 | 反馈可扫读，CTA 明确 | 已完成 |
| MUI-1.7 | 阶段自查与构建 | 前端 build、后端回归、Git 范围检查 | MUI-1.3~1.6 | P0 | build 通过，后端测试通过 | 已完成 |
| MUI-2 | 完整功能与体验测试 | 完整旅程、页面状态、多视口布局 E2E | MUI-1 | P0 | 测试报告和截图证据生成 | 已完成 |
| MUI-3 | 问题修复与定向复测 | 修复 MUI-ISSUE-001 触控目标 | MUI-2 | P0 | 多视口布局复测通过 | 已完成 |
| MUI-4 | S6 验收交付记录 | 交付清单、验收对照、遗留风险 | MUI-3 | P0 | `ACCEPT-001` 生成 | 已完成 |
| MUI-5 | S7 阶段复盘 | 复盘目标、问题、经验、后续动作 | MUI-4 | P1 | `RETRO-001` 生成 | 已完成 |
| MUI-6 | 全栈接手交接 | 完整交接文档和 S1/S2/S3 补档 | MUI-5 | P0 | `HANDOFF-001` 与本文件生成 | 已完成 |

## 5. 里程碑

| 里程碑 | 目标 | 交付物 | 完成标准 |
|---|---|---|---|
| MS-1 | MVP 功能闭环 | `phase1-delivery.md`、API/DB/QA 文档 | 注册到总结和历史回放可用 |
| MS-2 | 手机端 App 化 UI 实现 | 前端 App Shell 与页面调整 | 前端 build、后端模块测试通过 |
| MS-3 | 完整验证与修复 | `TEST-001`、Issue 清单、截图证据 | E2E 全部通过，P0/P1 清零 |
| MS-4 | 交付与复盘 | `ACCEPT-001`、`RETRO-001`、`CR-001` | 交付清单和复盘完整 |
| MS-5 | 接手移交 | `HANDOFF-001`、`REQ-001`、`DESIGN-001`、`PLAN-001` | 接手者能定位目标、进度、下一步 |

## 6. 风险清单

| 风险 | 影响 | 应对策略 | 是否需确认 |
|---|---|---|---|
| `talkmate.db` 本地运行数据变更 | 误提交数据库 | 保持不提交，提交前检查 staged 文件 | 否 |
| 当前 App 化 UI 已确认但尚未提交 | 提交时容易混入本地产物 | 精确 staged UI、依赖、文档文件，禁止 `git add .` | 否 |
| `evidence/` 本地证据目录 | 仓库膨胀 | 已加入根 `.gitignore`，不上传仓库 | 否 |
| 历史任务状态未同步 | 接手误判 | 以本计划、交付记录和 Git 主线为准 | 否 |
| HTTP 下语音能力受限 | 用户验收差异 | 正式环境使用 HTTPS，保留文字输入 | 否 |
| Vite/esbuild audit moderate 漏洞 | dev server 风险，强制修复需破坏性升级 | 后续单独建技术债评估 Vite 大版本升级 | 是 |

## 7. 验证计划

- 前端构建：`npm --prefix /home/user13/Desktop/talkmate/frontend run build`
- 后端模块测试：在 `backend` 下执行 auth/scenario/conversation/summary/ai_service pytest。
- 完整用户旅程 E2E：`tests/e2e/test_mobile_full_journey_e2e.py`
- 页面状态 E2E：`tests/e2e/test_mobile_states_e2e.py`
- 多视口布局 E2E：`tests/e2e/test_mobile_layout_e2e.py`
- 文档格式检查：`git diff --check`

## 8. S3 门禁结论

S3 门禁结论：通过。
任务数量：MVP 8 项 + 手机端 App 化 6 组。
关键依赖：S1/S2 已补档，MVP 和 UI 调整范围已明确。
验收方式：构建、pytest、Playwright E2E、Issue 复测、交付文档。
风险项：已跟踪数据库本地变更、当前 UI 尚未提交、Vite/esbuild audit 技术债、历史状态同步。
是否进入 S4：历史已进入并完成；后续新需求需重新从 S1 开始。
