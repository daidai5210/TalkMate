# TalkMate MVP 范围文档

> 版本：v2.0  
> 日期：2026-06-05  
> 来源：[项目启动卡](./project-brief.md)  

---

## 1. MVP 目标

验证用户能否通过浏览器与 AI 完成场景化的英语口语对话练习，并获得详细纠错和课后总结。

---

## 2. 用户与核心场景

| 用户 | 场景 | 目标 |
|------|------|------|
| 大学生 | 选择"面试"场景，用英语练习面试问答 | 提升面试英语口语表达能力 |
| 职场人士 | 选择"会议"场景，模拟英文会议发言 | 减少会议发言的紧张感和错误 |
| 出国旅游人群 | 选择"旅行"场景，模拟机场/酒店/问路/购物 | 旅行前口语突击，降低沟通障碍 |

---

## 3. 必做功能

| 编号 | 功能 | 说明 | 验收标准 | 优先级 |
|------|------|------|----------|--------|
| MVP-001 | 用户注册登录 | 账号密码注册（含简单验证码）、登录、登出、JWT 会话 | 能注册、登录、登出、刷新保持登录 | P0 |
| MVP-002 | 场景选择页面 | 首页展示 5 个场景卡片 | 能浏览场景并点击进入对话 | P0 |
| MVP-003 | 场景对话页面 | 回合制语音对话（用户说→AI 回复） | 能完成 ≥10 轮连续对话 | P0 |
| MVP-004 | STT 语音转文字 | 用户语音输入转文字（浏览器 Web Speech API） | 说话后 1 秒内显示文字 | P0 |
| MVP-005 | AI 对话回复 | 调用 DeepSeek API 生成场景化回复 | 回复与场景相关、语言自然 | P0 |
| MVP-006 | TTS 文字转语音 | AI 回复文字自动播放语音（浏览器 SpeechSynthesis） | 语音能正常播放 | P0 |
| MVP-007 | 对话历史记录 | 对话中保存每轮用户输入和 AI 回复 | 对话页面刷新后记录不丢失 | P1 |
| MVP-008 | 详细纠错反馈 | 对话结束后展示纠错，含语法解释、正确表达、改进建议 | 至少展示 1 条纠错，含详细解释 | P0 |
| MVP-009 | 详细课后总结 | 对话结束后生成总结：评分、语法问题、词汇分析、改进建议 | 展示综合评分、词汇分析、改进建议 | P0 |
| MVP-010 | 练习记录列表 | 首页展示用户历史练习记录 | 能看到每次练习的场景、日期、评分 | P1 |
| MVP-011 | 移动端响应式 UI | 手机为主，自适应 PC，一套 UI | 375px-1440px 均可正常使用 | P0 |
| MVP-012 | 4 种交互状态 | 每页实现 Default / Loading / Empty / Error 状态 | 所有页面状态完整 | P0 |

---

## 4. 暂不做功能

| 功能 | 暂不做原因 | 后续版本 |
|------|------------|----------|
| 多语种支持 | MVP 仅验证英语场景 | v0.2+ |
| 流式实时语音 | 回合制已够用，流式复杂度太高 | v0.3+ |
| 个人信息页 | 非 MVP 核心需求 | v0.2+ |
| 独立对话记录管理页 | 首页列表已够用 | v0.2+ |
| 社区/社交 | 非核心需求 | v1.0+ |
| 课程商城 | 非 MVP 目标 | 待定 |
| 教师端/管理后台 | 用户侧闭环未验证 | v1.0+ |
| 第三方登录 | 简化 MVP | v0.2+ |
| Native App / 小程序 | Web 端先验证 | 待定 |

---

## 5. 页面 / 接口范围

### 页面范围
- 登录页 `/login`
- 注册页 `/register`
- 首页（场景选择 + 练习记录列表）`/`
- 场景对话页 `/conversation/:id`
- 对话总结页 `/conversation/:id/summary`

### 接口范围
- `POST /api/v1/auth/register` — 用户注册
- `POST /api/v1/auth/login` — 用户登录
- `POST /api/v1/auth/logout` — 用户登出
- `GET /api/v1/scenarios` — 获取场景列表
- `POST /api/v1/conversations` — 创建对话
- `GET /api/v1/conversations` — 获取用户对话列表
- `GET /api/v1/conversations/:id` — 获取对话记录
- `POST /api/v1/conversations/:id/messages` — 发送消息（调用 AI）
- `POST /api/v1/conversations/:id/summary` — 生成总结
- `GET /api/v1/conversations/:id/summary` — 获取总结
- `GET /api/health` — 健康检查

### 数据范围
- `users` — 用户表（id, username, password_hash, created_at, updated_at, deleted_at）
- `scenarios` — 场景表（id, name, description, icon, prompt, sort_order, created_at, updated_at）
- `conversations` — 对话表（id, user_id, scenario_id, created_at, finished_at, deleted_at）
- `messages` — 消息表（id, conversation_id, role, text, created_at）
- `summaries` — 总结表（id, conversation_id, score, feedback, suggestions, grammar_issues, pronunciation_issues, vocabulary_usage, created_at）

---

## 6. 非功能要求

| 类型 | 要求 |
|------|------|
| 性能 | 端到端延迟（语音→AI 回复播放）≤ 3 秒；API 响应 ≤ 2 秒 |
| 安全 | 密码 bcrypt 加密；JWT 会话；HTTPS（生产环境）；.env 不进 Git |
| 兼容性 | Chrome/Edge/Safari 最新版；移动端 iOS Safari / Android Chrome |
| 部署 | 开发/测试在全栈主机，最终部署在 QA 主机 |
| 日志 | 后端请求日志（JSON 格式）；AI 调用日志（prompt/response/token 消耗） |

---

## 7. MVP 验收标准

- [ ] MVP-001 ~ MVP-012 全部完成
- [ ] 用户能完成完整流程：注册登录 → 选场景 → 对话 ≥10 轮 → 查看纠错 → 查看总结
- [ ] QA 测试报告建议通过
- [ ] PM 验收通过
- [ ] 已知 P2 问题不阻塞核心流程

---

## 8. 变更记录

| 日期 | 变更内容 | 原因 | 批准人 |
|------|----------|------|--------|
| 2026-06-05 | v2.0：基于完整需求分析重写 MVP 范围 | 补全需求分析、技术选型、架构、数据库、API 设计 | PM |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | v2.0：基于完整需求分析重写 MVP 范围 | 产品经理 |
