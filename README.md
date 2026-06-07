# TalkMate - AI 英语口语陪练

> 让中国英语学习者看见自己的"中式英语"画像，告别盲目练习。

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://talkmate-github-preview.vercel.app)
[![Version](https://img.shields.io/badge/version-v0.2.0-blue)](#版本路线)
[![License](https://img.shields.io/badge/license-Internal-lightgrey)](#许可证)

---

## 项目简介

**TalkMate** 是一款基于 AI 的英语口语练习应用，专为中国英语学习者设计。通过场景对话、AI 实时纠错、个性化错误画像与定向复练推荐，让每一次练习都有沉淀、每一步成长都看得见。

与市面上其他英语口语 App 不同，TalkMate 不止于"打分"，更聚焦于**"你到底是什么地方老出错"**——这是中式英语学习者最常被忽略的痛点。

---

## 市场调研

### 行业现状

- **市场规模**：中国英语学习者超 3 亿，在线口语练习赛道 2025 年规模约 ¥200 亿，年增速 15%+。
- **竞品分析**：
  - 流利说、多邻国、Cake 等：偏重课程化与游戏化，纠错反馈浅层。
  - ChatGPT/豆包类通用 AI：缺乏针对中式英语的系统化错误追踪。
  - 真人外教 1v1：成本高（¥80-200/节），难以规模化。
- **痛点空白**：
  - 现有产品"打分但不诊断"——用户只看到分数，不知道"我老在哪儿翻车"。
  - 缺少**长期错误趋势追踪**，每次练习是孤岛，没有累积视角。
  - 推荐内容与用户弱项脱节，无法形成"刻意练习"闭环。

### 产品定位

> **TalkMate = AI 口语练习 + 中式英语专属错误画像 + 定向复练教练**

我们不做大而全的英语学习平台，只专注一件事：**帮中国学习者系统性解决"中式英语"问题**。

---

## 核心特色功能

### 1. 🎯 场景对话练习

- 5 大真实场景：面试、点餐、会议、旅行、日常社交。
- AI 角色扮演，支持中英自由切换，多轮上下文记忆。
- 语音输入 + TTS 播放，贴近真实口语交流。

### 2. 📊 AI 智能纠错（v0.1.0）

- 每轮对话结束后，AI 自动识别**语法、用词、表达**问题。
- 给出原文 → 正确版 → 原因 → 改进建议的完整纠错链。
- 同步生成**词汇分析**（词汇水平、高级词汇、重复词汇）。

### 3. 🌟 中文母语错误画像 + 个性化复练闭环（v0.2.0 重点功能）

#### 为什么要做这个功能？

**用户原话**："我练完后只知道'这次'犯了多少错，但不知道'我是不是老在同一个坑里'。"

这是中式英语学习者最普遍、却最被忽略的痛点：
- ✅ v0.1.0 已做：单次总结反馈（告诉你这次哪里错了）。
- ❌ v0.1.0 没做：跨练习的弱项追踪（告诉你哪些坑你**总是**踩）。
- ❌ v0.1.0 没做：基于弱项的定向复练（告诉你**下次**该练什么）。

#### 我们怎么做？

**5 类中式英语错误标签**（AI 自动分类）：

| 错误类型 | 含义 | 推荐练习场景 |
|---|---|---|
| **中式语序** (word_order) | 受中文语法影响产生的语序错误 | 面试 |
| **时态** (tense) | 过去/现在/将来时态混用 | 会议 |
| **冠词** (article) | a/an/the 缺失或误用 | 日常 |
| **介词** (preposition) | in/on/at/to/for/with 误用 | 旅行 |
| **直译表达** (direct_translation) | 语法正确但不自然的中式直译 | 日常 |

**两层数据展示**：

- **总结页**：本次练习的 5 类错误柱状分布 + 最高频问题。
- **首页**：基于最近 5 次练习聚合的**个性化推荐**——"建议你练【会议】场景，重点改善【时态】问题"。

**滑动窗口机制**：

- 按**最近 5 次**练习聚合，确保推荐反映**当前**的弱项，而非历史旧账。
- 错误率超过 70% 即视为"已解锁画像"。
- 删除对话时同步从窗口移除，但累计计数保留——既保护隐私，又不丢失历史。

#### 验证效果

- 20 条样本抽检，AI 分类准确率 **70%**（达到 PRD 阈值）。
- 完整覆盖 AC-001 ~ AC-007 全部验收标准。
- 本地 UI 运行时验证通过，详见 [QA 验收报告](docs/versions/v0.2.0/qa/acceptance-report.md)。

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router |
| 后端 | FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Pydantic Settings |
| 数据库 | SQLite (本地) / TiDB Cloud MySQL (生产) |
| AI | DeepSeek (deepseek-v4-flash, OpenAI 兼容协议) |
| 鉴权 | JWT (HS256) + bcrypt 密码哈希 |
| 部署 | Vercel Serverless (Python) + Vercel Static (前端) |
| 监控 | Vercel Logs + Vercel Inspect |

---

## 项目结构

```
talkmate/
├── api/                       # Vercel Serverless 入口
│   └── index.py               #   暴露 FastAPI app 对象
├── backend/                   # 后端服务（FastAPI）
│   ├── app/
│   │   ├── modules/
│   │   │   ├── auth/          #   认证（注册/登录/JWT）
│   │   │   ├── scenario/      #   场景管理
│   │   │   ├── conversation/  #   对话与消息
│   │   │   ├── summary/       #   AI 总结与纠错
│   │   │   ├── practice/      #   抽卡跟练
│   │   │   └── profile/       #   用户错误画像（v0.2.0 新增）
│   │   ├── core/              #   配置、安全、异常
│   │   ├── db/                #   数据库连接与初始化
│   │   └── shared/            #   共享响应与异常
│   ├── venv/                  #   Python 虚拟环境（不入仓）
│   └── requirements.txt
├── frontend/                  # 前端 SPA（React）
│   ├── src/
│   │   ├── components/        #   通用组件
│   │   │   ├── ErrorProfileCard.tsx        # v0.2.0 新增
│   │   │   └── TrainingRecommendBanner.tsx # v0.2.0 新增
│   │   ├── pages/             #   路由页面
│   │   ├── features/          #   业务功能模块
│   │   ├── services/          #   API 调用层
│   │   └── stores/            #   Zustand 状态
│   └── package.json
├── docs/                      # 项目文档
│   └── versions/
│       ├── v0.1.0/            #   MVP + 移动端 App 化
│       └── v0.2.0/            #   中文母语错误画像（当前）
├── tests/                     # E2E 测试
├── vercel.json                # Vercel 部署配置
└── README.md
```

---

## 快速开始

### 环境要求

- **Python**：3.12+
- **Node.js**：18+
- **SQLite**：内置（本地开发）
- **DeepSeek API Key**：从队长处获取

### 本地启动

#### 1. 克隆仓库

```bash
git clone https://github.com/daidai5210/TalkMate.git
cd TalkMate
```

#### 2. 启动后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 复制环境变量模板并填写
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY、JWT_SECRET 等

# 启动后端
PYTHONPATH=. ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

后端健康检查：`curl http://localhost:8000/api/health`

#### 3. 启动前端

```bash
cd frontend
npm install

# 开发模式（同源：使用 Vite proxy，无需配置 baseURL）
npm run dev

# 浏览器访问
open http://localhost:5173
```

#### 4. 验证

- 注册新用户（验证码见 `REGISTER_CAPTCHA`）
- 选择场景开始对话
- 结束后查看总结页错误画像
- 累计 5 次练习后查看首页个性化推荐

---

## Vercel 部署

### 部署架构

- **前端**：Vercel Static Build，输出 `frontend/dist`
- **后端**：Vercel Python Serverless，入口 `api/index.py`
- **API 路由**：`/api/*` 同源请求，无需 CORS 跨域

### 必需环境变量（Production）

| 变量 | 说明 | 示例 |
|---|---|---|
| `DATABASE_URL` | MySQL 连接串（TiDB Cloud） | `mysql+pymysql://user:pass@host:4000/talkmate?ssl_verify_cert=true&ssl_verify_identity=true` |
| `JWT_SECRET` | JWT 签名密钥（≥32 字符） | `your-strong-random-secret-32chars` |
| `CORS_ORIGINS` | 允许的来源域名 | `https://talkmate-github-preview.vercel.app` |
| `REGISTER_CAPTCHA` | 注册验证码（4 位数字） | `1234` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxxxxxxx` |
| `DEEPSEEK_BASE_URL` | DeepSeek API 地址 | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | 使用的模型 | `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT` | API 超时（秒） | `10.0` |

> ⚠️ **注意**：`VITE_API_BASE_URL` 在 Vercel 同源部署中**不设置**或设置为空，前端通过同源 `/api/*` 调用后端。

### 部署步骤

1. **关联 GitHub 仓库**：在 Vercel 控制台导入 `daidai5210/TalkMate`。
2. **配置环境变量**：在 Project Settings → Environment Variables 中填入上表变量。
3. **触发部署**：push 到 `main` 分支自动触发 Production 部署。
4. **验证**：
   - 访问 `https://<your-domain>/api/health` 应返回 `{"status":"ok"}`
   - 注册/登录流程正常
   - 5 次练习后首页显示个性化推荐

### 常见问题

#### Q: 登录返回 500？

A: 大概率是 `DATABASE_URL` 或 `JWT_SECRET` 未在 Vercel 环境变量中正确配置。检查：
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Production 和 Preview 作用域需分别配置
3. 使用 `vercel logs <deployment-url>` 查看详细错误

#### Q: API 响应慢？

A: Python Serverless 冷启动 + TiDB 首连可能耗时 10s+。可：
1. 适当延长 `DEEPSEEK_TIMEOUT`
2. 前端展示加载状态
3. 升级 Vercel 计划获得更短的冷启动时间

更多部署细节：[Vercel 部署手册](docs/versions/v0.1.0/deployment/vercel-tidbcloud.md)

---

## 版本路线

| 版本 | 主要交付 | 状态 |
|---|---|---|
| **v0.1.0** | MVP + 移动端 App 化 + Vercel/TiDB 部署 | ✅ 已发布 |
| **v0.2.0** | 中文母语错误画像 + 个性化复练闭环 | ✅ 已发布 |
| v0.3.0 | 趋势图 / 快照 / 长期画像 | 📋 规划中 |

### v0.2.0 新增功能一览

- 后端：5 类错误标签、滑动窗口聚合、删除对话同步
- 前端：`ErrorProfileCard` 总结页卡片、`TrainingRecommendBanner` 首页推荐
- AI：DeepSeek prompt 增强，输出 `error_profile` 字段
- 文档：PRD、技术设计、QA 验收报告完整归档

---

## 文档导航

- 📋 [需求文档](docs/versions/v0.2.0/product/prd.md)
- 🏗️ [技术设计](docs/versions/v0.2.0/architecture/tech-design.md)
- ✅ [QA 验收报告](docs/versions/v0.2.0/qa/acceptance-report.md)
- 🚀 [Vercel 部署手册](docs/versions/v0.1.0/deployment/vercel-tidbcloud.md)
- 📚 [完整文档索引](docs/INDEX.md)

---

## 开发与贡献

### 代码规范

- 后端：遵循 [PEP 8](https://peps.python.org/pep-0008/)，类型注解完整
- 前端：ESLint + TypeScript strict 模式
- 提交信息：[Conventional Commits](https://www.conventionalcommits.org/) 规范

### 测试

```bash
# 后端单元测试
cd backend
PYTHONPATH=. ./venv/bin/pytest app -q

# 前端构建验证
cd frontend
npm run build
```

### PR 流程

1. 从 `main` 创建特性分支：`git checkout -b feat/your-feature`
2. 提交并推送：`git push origin feat/your-feature`
3. 创建 PR，标题和描述需包含：功能描述、实现思路、测试方式
4. CI 通过后由 Reviewer 合并

---

## 团队

- **PM/FS**：兼产品与全栈开发
- **QA**：测试运维
- **队长**：项目决策与最终验收

---

## 许可证

Internal use only. 未经许可不得外传或商业化使用。

---

> 📌 **当前版本**：v0.2.0 | 最后更新：2026-06-07
