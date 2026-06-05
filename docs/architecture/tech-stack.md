# TalkMate 技术选型文档

> 版本：v1.0  
> 日期：2026-06-05  

---

## 一、前端

| 维度 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | React + TypeScript | 18+ | 生态成熟、类型安全、组件复用好 |
| 构建工具 | Vite | 5+ | 启动快、热更新快、配置简单 |
| 路由 | React Router | v6 | React 生态标准路由 |
| 状态管理 | Zustand | 4+ | 轻量、API 简单、适合中小项目 |
| HTTP 客户端 | Axios | 1+ | 拦截器、错误处理、类型支持好 |
| UI 框架 | Tailwind CSS | 3+ | 响应式友好、按设计系统 token 定义、无组件库锁定 |
| 语音 STT | Web Speech API (SpeechRecognition) | 浏览器内置 | 免费、无需服务器、MVP 够用 |
| 语音 TTS | Web Speech API (SpeechSynthesis) | 浏览器内置 | 免费、内置浏览器支持 |

## 二、后端

| 维度 | 选型 | 版本 | 理由 |
|------|------|------|------|
| 框架 | FastAPI | 0.100+ | 异步支持好、自动生成 API 文档、类型安全 |
| ORM | SQLAlchemy | 2.0+ | Python 生态最成熟 ORM、支持异步 |
| 数据库 | SQLite | 3+ | MVP 阶段零运维、无需独立数据库服务 |
| 认证 | python-jose (JWT) | 0.9+ | 轻量、JWT 标准实现 |
| 密码加密 | bcrypt | 4+ | 行业标准、不可逆加密 |
| 配置管理 | pydantic-settings | 2+ | 与 FastAPI 无缝集成、.env 自动加载 |

## 三、AI 集成

| 维度 | 选型 | 理由 |
|------|------|------|
| AI 服务 | DeepSeek v4-flash | 队长提供，OpenAI 兼容协议，成本低 |
| SDK | openai Python SDK | DeepSeek 兼容 OpenAI 协议，直接使用 |
| Prompt 管理 | 后端模块内 YAML 配置 | MVP 阶段简单维护，不需要专用工具 |

## 四、工程工具

| 维度 | 选型 | 用途 |
|------|------|------|
| 前端 lint | ESLint + Prettier | 代码风格统一、格式化 |
| 后端 lint | Ruff + Black | 代码风格统一、格式化 |
| 前端包管理 | npm | 依赖安装与构建 |
| 后端包管理 | pip + requirements.txt | 依赖安装与锁定 |
| Git 分支策略 | feature/* → PR 合并 main | 团队 GitHub 工作流规范 |

## 五、决策依据

### 为什么选 React 而非 Vue
- 团队技术栈偏向 React，TypeScript 集成更好
- Zustand 比 Vuex/Pinia 更轻量，适合 3 人小团队

### 为什么选 FastAPI 而非 Node.js
- Python 生态对 AI 集成更友好（openai SDK 原生支持）
- FastAPI 自动生成交互式 API 文档，减少文档维护成本

### 为什么选 SQLite 而非 PostgreSQL
- MVP 阶段用户量小，SQLite 性能足够
- 零运维成本，无需独立数据库服务
- 后续用户量增长可平滑迁移到 PostgreSQL

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本 | 产品经理 |
