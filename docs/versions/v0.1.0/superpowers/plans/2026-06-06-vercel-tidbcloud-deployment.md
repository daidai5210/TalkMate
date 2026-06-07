# TalkMate Vercel + TiDB Cloud Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TalkMate 从当前本机/FRP 临时部署迁移为 Vercel 前端 + Vercel 后端 Serverless API + TiDB Cloud 数据库的可持续线上部署。

**Architecture:** 前端继续使用 React + Vite 静态构建部署到 Vercel，后端 FastAPI 改造成可被 Vercel Python Runtime 加载的 ASGI 应用，数据库从 SQLite 切换为 TiDB Cloud MySQL 协议连接。保留本地 SQLite 开发能力，通过 `DATABASE_URL` 在本地、测试、线上之间切换。

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, FastAPI 0.115, SQLAlchemy 2.0, PyMySQL, TiDB Cloud Starter, Vercel, GitHub Actions/PR workflow.

---

## 0. 队长需要提供的信息

### 0.1 Vercel 信息

队长需要提供或在 Vercel 控制台中配置：

1. GitHub 仓库地址，例如：`https://github.com/<owner>/<repo>`。
2. Vercel 项目归属：个人账号还是 Team。
3. 允许 Vercel 导入该 GitHub 仓库。
4. 是否使用自定义域名；如果暂不使用，Vercel 默认域名即可。
5. DeepSeek API Key 是否继续使用；如果继续使用，需要配置为 Vercel 环境变量，不要发到群里明文。

### 0.2 TiDB Cloud 信息

队长需要在 TiDB Cloud 中创建 Starter 集群或授权开发人员创建，并提供以下连接信息，建议通过私密渠道或 Vercel 环境变量面板填写，不要在群聊明文发送密码：

1. TiDB Cloud 账号是否已注册并可登录。
2. Cluster Host，例如：`gateway01.<region>.prod.aws.tidbcloud.com`。
3. Port，通常是 `4000`。
4. Database Name，建议：`talkmate`。
5. Username，例如：`<cluster_user>`。
6. Password。
7. 是否要求 SSL；TiDB Cloud 通常要求 TLS/SSL。
8. CA 证书要求。如果控制台给出 CA 下载链接或 `ssl_ca` 参数，需要一并提供给开发人员。
9. 是否允许公网连接；如果 TiDB Cloud 有 IP Access List，需要放行 Vercel 出口或选择允许公网安全连接。Vercel 出口 IP 不固定，Starter 阶段更适合使用 TiDB Cloud 提供的公网 TLS 连接能力。

### 0.3 不需要队长提供的内容

1. 不需要在 PM、QA 机器上配置 TiDB/Vercel 环境。
2. 不需要所有成员都安装 TiDB CLI；只需要负责实施的开发环境或 CI/Vercel 配置好即可。
3. 不需要提供本地 SQLite 数据库文件，除非要迁移历史测试数据。当前更建议线上新库初始化种子数据。

---

## 1. 文件结构与职责

### 需要新增

- `vercel.json`
  - Vercel 全栈部署入口配置。
  - 配置前端构建输出、后端 Python 函数入口、SPA 路由回退和 API 路由。

- `api/index.py`
  - Vercel Python Runtime 入口。
  - 从 `backend/app/main.py` 导入 FastAPI `app`。

- `backend/app/db/url.py`
  - 数据库 URL 归一化工具。
  - 兼容 SQLite、本地 MySQL/TiDB、TiDB Cloud TLS 参数。

- `backend/tests/test_database_url.py`
  - 验证 TiDB/MySQL URL 不会带 SQLite 专用参数。
  - 验证 SQLite 仍保留 `check_same_thread=False`。

- `docs/deployment/vercel-tidbcloud.md`
  - 部署操作手册。
  - 记录 Vercel 环境变量、TiDB Cloud 连接方式、验证清单和回滚方案。

### 需要修改

- `backend/requirements.txt`
  - 新增 MySQL/TiDB 驱动：`pymysql==1.1.1`。
  - 如 Vercel Python Runtime 需要，保留 `fastapi`、`sqlalchemy`、`uvicorn`。

- `backend/app/db/base.py`
  - 使用新建的数据库 URL 工具。
  - 仅在 SQLite 下使用 `connect_args={"check_same_thread": False}`。
  - MySQL/TiDB 下配置 `pool_pre_ping=True`。

- `backend/app/main.py`
  - 保持 `app` 可直接导入。
  - 检查 lifespan 在 Serverless 冷启动时是否可接受；保留自动建表和种子初始化，但种子函数必须幂等。

- `frontend/.env.example`
  - 增加 Vercel 场景说明。
  - 推荐线上 `VITE_API_BASE_URL=/api` 或同源 API 方案。

- `frontend/src/services/api.ts`
  - 如果线上采用同源 API，需要确认 baseURL 为空或 `/api` 时路径不会变成 `/api/api/v1/...`。
  - 当前服务层请求已经写成 `/api/v1/...`，因此推荐 Vercel 同源时设置 `VITE_API_BASE_URL=` 空值；跨域后端时才设置完整 URL。

---

## 2. 推荐部署架构

### 2.1 Vercel 单项目全栈部署

推荐一个 Vercel 项目同时承载：

- 静态前端：`frontend/dist`
- Serverless 后端：`api/index.py`
- API 路径：`/api/*`
- SPA 路由：所有非 API 路径回退到前端 `index.html`

优势：

1. 前端和后端同源，CORS 问题最小。
2. 前端 `VITE_API_BASE_URL` 可为空，继续请求 `/api/v1/...`。
3. Vercel Preview Deployment 可用于 PR 预览。

### 2.2 TiDB Cloud 替代 SQLite

线上使用 TiDB Cloud。SQLAlchemy URL 建议格式：

```text
mysql+pymysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?ssl_verify_cert=true&ssl_verify_identity=true
```

如果 TiDB Cloud 控制台要求 CA：

```text
mysql+pymysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?ssl_ca=/var/task/certs/ca.pem
```

注意：Vercel Serverless 文件系统只适合只读部署产物，不适合运行期写入证书。若需要 CA 文件，应将证书作为仓库内非敏感公共 CA 文件或通过环境变量注入后在启动时处理。优先采用 TiDB Cloud 官方推荐的 Python 连接串。

---

## 3. 环境变量设计

### 3.1 Vercel Production 环境变量

```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate?ssl_verify_cert=true&ssl_verify_identity=true
JWT_SECRET=<生产随机强密钥，至少32字符>
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
CORS_ORIGINS=https://<vercel-production-domain>
REGISTER_CAPTCHA=<注册验证码，建议不要继续用1234>
DEEPSEEK_API_KEY=<DeepSeek API Key>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=8.0
AI_MAX_HISTORY=20
VITE_API_BASE_URL=
```

### 3.2 Vercel Preview 环境变量

```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate_preview?ssl_verify_cert=true&ssl_verify_identity=true
JWT_SECRET=<preview随机强密钥>
CORS_ORIGINS=https://*.vercel.app
REGISTER_CAPTCHA=<preview注册验证码>
VITE_API_BASE_URL=
```

如果 TiDB Starter 只建一个库，可先使用同一个库，但必须接受 preview 测试数据污染风险。更推荐 `talkmate` 和 `talkmate_preview` 两个 database。

---

## 4. 实施任务

### Task 1: 建立 TiDB Cloud 连接准备

**Files:**
- No code change in this task.

- [ ] **Step 1: 安装 TiDB Cloud CLI（只在开发实施机器执行）**

Run:

```bash
curl https://raw.githubusercontent.com/tidbcloud/tidbcloud-cli/main/install.sh | sh
tiup install cloud
```

Expected:

```text
TiDB Cloud CLI installed
```

- [ ] **Step 2: 登录 TiDB Cloud**

Run:

```bash
ticloud auth login
```

Expected:

```text
Logged in successfully
```

- [ ] **Step 3: 获取或创建 Starter 集群**

Run:

```bash
ticloud cluster list
```

Expected:

```text
集群列表中存在可用 Starter 集群
```

如果没有集群，由开发人员按 TiDB Cloud 官方文档创建 Starter 集群。创建后记录：host、port、username、database、SSL 要求。

- [ ] **Step 4: 创建数据库**

在 TiDB SQL 控制台或 mysql client 中执行：

```sql
CREATE DATABASE IF NOT EXISTS talkmate CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
CREATE DATABASE IF NOT EXISTS talkmate_preview CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
```

Expected:

```text
Query OK
```

---

### Task 2: 增加 MySQL/TiDB 驱动依赖

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: 修改依赖**

在 `backend/requirements.txt` 末尾新增：

```text
pymysql==1.1.1
```

- [ ] **Step 2: 本地安装依赖**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
pip install -r requirements.txt
```

Expected:

```text
Successfully installed pymysql-1.1.1
```

- [ ] **Step 3: 验证导入**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
python - <<'PY'
import pymysql
print(pymysql.__version__)
PY
```

Expected:

```text
1.1.1
```

---

### Task 3: 抽离数据库连接配置

**Files:**
- Create: `backend/app/db/url.py`
- Modify: `backend/app/db/base.py`
- Test: `backend/tests/test_database_url.py`

- [ ] **Step 1: 新增数据库 URL 工具测试**

Create `backend/tests/test_database_url.py`:

```python
from app.db.url import build_engine_kwargs


def test_sqlite_engine_kwargs_include_check_same_thread():
    kwargs = build_engine_kwargs("sqlite:///./talkmate.db")
    assert kwargs["connect_args"] == {"check_same_thread": False}
    assert "pool_pre_ping" not in kwargs


def test_tidb_engine_kwargs_enable_pool_pre_ping_without_sqlite_connect_args():
    kwargs = build_engine_kwargs(
        "mysql+pymysql://user:password@example.com:4000/talkmate?ssl_verify_cert=true"
    )
    assert kwargs["pool_pre_ping"] is True
    assert "connect_args" not in kwargs
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
pytest tests/test_database_url.py -v
```

Expected:

```text
ModuleNotFoundError: No module named 'app.db.url'
```

- [ ] **Step 3: 新增实现**

Create `backend/app/db/url.py`:

```python
from typing import Any


def build_engine_kwargs(database_url: str) -> dict[str, Any]:
    if database_url.startswith("sqlite"):
        return {"connect_args": {"check_same_thread": False}}

    if database_url.startswith("mysql"):
        return {"pool_pre_ping": True}

    return {}
```

- [ ] **Step 4: 修改 engine 创建逻辑**

Modify `backend/app/db/base.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.db.url import build_engine_kwargs

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    **build_engine_kwargs(settings.DATABASE_URL),
)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app.modules.auth.models import User  # noqa: F401
    from app.modules.conversation.models import Conversation, Message  # noqa: F401
    from app.modules.scenario.models import Scenario  # noqa: F401
    from app.modules.summary.models import Summary  # noqa: F401
    from app.modules.practice.models import PracticeCard, PracticeRecord, UserAchievement  # noqa: F401

    Base.metadata.create_all(bind=engine)
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
pytest tests/test_database_url.py -v
```

Expected:

```text
2 passed
```

---

### Task 4: 增加 Vercel 后端入口

**Files:**
- Create: `api/index.py`

- [ ] **Step 1: 新增 Vercel ASGI 入口**

Create `api/index.py`:

```python
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.main import app  # noqa: E402,F401
```

- [ ] **Step 2: 本地验证入口可导入**

Run:

```bash
cd /home/user13/Desktop/talkmate
python - <<'PY'
from api.index import app
print(app.title)
PY
```

Expected:

```text
TalkMate API
```

---

### Task 5: 增加 Vercel 配置

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: 新增 Vercel 配置**

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/frontend/dist/assets/$1"
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|map))",
      "dest": "/frontend/dist/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/index.html"
    }
  ]
}
```

- [ ] **Step 2: 确认前端构建命令可在 frontend 目录执行**

Run:

```bash
cd /home/user13/Desktop/talkmate/frontend
npm run build
```

Expected:

```text
✓ built in
```

---

### Task 6: 调整前端 API 地址策略

**Files:**
- Modify: `frontend/.env.example`
- Inspect: `frontend/src/services/api.ts`

- [ ] **Step 1: 检查服务层路径**

确认 `frontend/src/services/api.ts` 使用：

```ts
baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
```

并确认各 service 请求路径以 `/api/v1/...` 开头。

- [ ] **Step 2: 修改 `.env.example`**

Modify `frontend/.env.example`:

```env
# 本地后端开发：
VITE_API_BASE_URL=http://127.0.0.1:8000

# Vercel 同源部署：在 Vercel 环境变量中将 VITE_API_BASE_URL 留空或不设置，
# 前端会直接请求 /api/v1/...，由 vercel.json 转发到 FastAPI。
```

- [ ] **Step 3: 本地模拟 Vercel 同源构建**

Run:

```bash
cd /home/user13/Desktop/talkmate/frontend
VITE_API_BASE_URL= npm run build
```

Expected:

```text
✓ built in
```

---

### Task 7: TiDB Cloud 建表与种子数据验证

**Files:**
- No code change if Tasks 2-3 are complete.

- [ ] **Step 1: 使用 TiDB DATABASE_URL 运行后端启动检查**

Run:

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
DATABASE_URL='mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate?ssl_verify_cert=true&ssl_verify_identity=true' \
CORS_ORIGINS='http://127.0.0.1:4180' \
JWT_SECRET='local-tidb-test-secret-change-me-32chars' \
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Expected:

```text
Application startup complete
```

- [ ] **Step 2: 验证健康检查**

Run in another terminal:

```bash
curl -s http://127.0.0.1:8000/api/health
```

Expected:

```json
{"code":0,"message":"success","data":{"status":"ok","service":"talkmate-backend","version":"0.1.0"}}
```

- [ ] **Step 3: 验证种子数据**

Run:

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"tidbtest001","password":"demo1234","captcha":"1234"}'
```

Expected:

```json
{"code":0,"message":"success","data":{"id":...}}
```

Run:

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"tidbtest001","password":"demo1234"}' | python -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

curl -s http://127.0.0.1:8000/api/v1/scenarios \
  -H "Authorization: Bearer $TOKEN"
```

Expected:

```json
{"code":0,"message":"success","data":[...5 scenarios...]}
```

---

### Task 8: Vercel 环境变量配置

**Files:**
- No repository code change.

- [ ] **Step 1: 在 Vercel Project Settings 配置 Production 环境变量**

配置：

```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate?ssl_verify_cert=true&ssl_verify_identity=true
JWT_SECRET=<生产随机强密钥>
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
CORS_ORIGINS=https://<production-domain>
REGISTER_CAPTCHA=<生产验证码>
DEEPSEEK_API_KEY=<DeepSeek API Key>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=8.0
AI_MAX_HISTORY=20
```

`VITE_API_BASE_URL` 不设置或设置为空字符串。

- [ ] **Step 2: 配置 Preview 环境变量**

配置：

```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate_preview?ssl_verify_cert=true&ssl_verify_identity=true
JWT_SECRET=<preview随机强密钥>
CORS_ORIGINS=https://*.vercel.app
REGISTER_CAPTCHA=<preview验证码>
DEEPSEEK_API_KEY=<DeepSeek API Key>
```

---

### Task 9: GitHub 到 Vercel 部署

**Files:**
- No code change if previous tasks committed and pushed.

- [ ] **Step 1: 推送部署分支**

Run:

```bash
cd /home/user13/Desktop/talkmate
git checkout -b feat/vercel-tidbcloud-deployment
git add vercel.json api/index.py backend/app/db/url.py backend/app/db/base.py backend/requirements.txt backend/tests/test_database_url.py frontend/.env.example docs/deployment/vercel-tidbcloud.md docs/superpowers/plans/2026-06-06-vercel-tidbcloud-deployment.md
git commit -m "feat(deploy): add vercel and tidbcloud deployment support"
git push -u origin feat/vercel-tidbcloud-deployment
```

Expected:

```text
remote: Create a pull request
```

- [ ] **Step 2: 在 Vercel 导入 GitHub 仓库**

Vercel 控制台操作：

```text
Add New Project -> Import Git Repository -> 选择 TalkMate 仓库 -> Deploy
```

Expected:

```text
Deployment completed
```

- [ ] **Step 3: 创建 PR 并通过 Preview URL 验证**

Run:

```bash
gh pr create --title "feat: deploy TalkMate on Vercel with TiDB Cloud" --body "$(cat <<'EOF'
## Summary
- Add Vercel full-stack deployment config
- Add TiDB Cloud SQLAlchemy connection support
- Document environment variables and deployment verification

## Test plan
- [ ] backend database URL tests pass
- [ ] frontend build passes
- [ ] Vercel preview health check passes
- [ ] Vercel preview register/login/scenario flow passes
EOF
)"
```

---

### Task 10: 线上验证

**Files:**
- Test: `tests/e2e/test_phase2_e2e.py`

- [ ] **Step 1: 验证健康检查**

Run:

```bash
curl -s https://<vercel-domain>/api/health
```

Expected:

```json
{"code":0,"message":"success","data":{"status":"ok","service":"talkmate-backend","version":"0.1.0"}}
```

- [ ] **Step 2: 验证 SPA 刷新路由**

Run:

```bash
curl -I https://<vercel-domain>/login
curl -I https://<vercel-domain>/app/home
curl -I https://<vercel-domain>/practice-card
```

Expected:

```text
HTTP/2 200
```

- [ ] **Step 3: 验证注册登录 API**

Run:

```bash
curl -s -X POST https://<vercel-domain>/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"verceltest001","password":"demo1234","captcha":"<REGISTER_CAPTCHA>"}'
```

Expected:

```json
{"code":0,"message":"success","data":{"id":...}}
```

- [ ] **Step 4: 跑线上 E2E**

Run:

```bash
cd /home/user13/Desktop/talkmate
E2E_BASE_URL=https://<vercel-domain> pytest tests/e2e/test_phase2_e2e.py -v
```

Expected:

```text
18 passed
```

---

## 5. 风险控制

### 5.1 数据库风险

1. SQLite 到 TiDB 是数据库类型迁移，可能暴露 SQL 方言差异。
2. 当前项目使用 `Base.metadata.create_all()`，适合 MVP，但长期应引入 Alembic 迁移。
3. TiDB Cloud 连接数和 Serverless 冷启动需要观察；已通过 `pool_pre_ping=True` 降低 stale connection 风险。
4. 线上不要提交 `talkmate.db`，该文件必须继续保持不入仓。

### 5.2 Vercel Serverless 风险

1. FastAPI 在 Vercel Python Serverless 上可运行，但长耗时 AI 调用可能触发函数超时。
2. `DEEPSEEK_TIMEOUT` 建议线上设置为 `8.0`，同时前端展示加载和错误态。
3. Serverless 不适合本地文件写入，所有状态必须进入 TiDB。
4. 冷启动时执行 `init_db()` 和 seed 可能增加首次响应时间；当前种子数据少，可接受。后续应改为一次性迁移脚本。

### 5.3 CORS 风险

推荐同源部署，前端请求 `/api/v1/...`，减少 CORS。如果后端单独域名部署，则必须将前端 Vercel 域名加入 `CORS_ORIGINS`。

### 5.4 密钥风险

1. `DATABASE_URL`、`JWT_SECRET`、`DEEPSEEK_API_KEY` 禁止写入仓库。
2. 只允许放在 Vercel Environment Variables 或本地 `.env`。
3. 群聊中不要明文发送数据库密码和 API Key。

---

## 6. 交付门禁

### DoR

- [ ] 队长确认使用 Vercel 单项目全栈部署。
- [ ] 队长提供 TiDB Cloud 连接信息或授权开发人员创建。
- [ ] 队长确认是否需要迁移旧 SQLite 数据；默认不迁移，仅初始化种子数据。
- [ ] DeepSeek API Key 可在 Vercel 私密配置。

### DoD

- [ ] `pytest backend/tests/test_database_url.py -v` 通过。
- [ ] `cd frontend && npm run build` 通过。
- [ ] Vercel Preview `/api/health` 返回 200。
- [ ] Vercel Preview SPA 路由刷新返回 200。
- [ ] Vercel Preview 注册/登录/场景列表可用。
- [ ] 线上 E2E 通过或记录明确失败原因。
- [ ] 部署文档 `docs/deployment/vercel-tidbcloud.md` 完成。

---

## 7. 建议执行顺序

1. 队长提供 TiDB Cloud 连接信息。
2. 全栈在本地完成 TiDB 连接适配和测试。
3. 全栈增加 Vercel 配置和后端入口。
4. 全栈推送部署分支并创建 PR。
5. 队长或全栈在 Vercel 控制台配置环境变量。
6. Vercel Preview 自动部署。
7. QA 执行线上冒烟 + E2E。
8. PM 汇总验收，队长确认上线。

---

## 8. Self-Review

### Spec coverage

- 已覆盖 Vercel 前端部署。
- 已覆盖 FastAPI 后端部署。
- 已覆盖 TiDB Cloud 替代 SQLite。
- 已列出队长需要提供的信息。
- 已明确开发人员负责实施，PM/QA 不需要本机配置开发环境。
- 已覆盖验证、风险、密钥和回滚关注点。

### Placeholder scan

无 `TBD`、`TODO`、`implement later`。所有实施任务均有明确文件、命令和预期结果。

### Type consistency

新增函数统一命名为 `build_engine_kwargs(database_url: str) -> dict[str, Any]`，测试和调用一致。
