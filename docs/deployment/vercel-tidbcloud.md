# TalkMate Vercel + TiDB Cloud 部署手册

## 目标

将 TalkMate 部署为：

- 前端：Vercel 静态站点，构建目录 `frontend/dist`
- 后端：Vercel Python Serverless，入口 `api/index.py`
- 数据库：TiDB Cloud Starter，通过 MySQL 协议连接
- API：同源 `/api/*`

## 队长需要准备

### Vercel

- Vercel 账号已关联 GitHub。
- Vercel 可导入 TalkMate GitHub 仓库。
- 如需自定义域名，提前准备域名；否则使用 Vercel 默认域名。

### TiDB Cloud

请在 TiDB Cloud 控制台或 CLI 中准备 Starter 集群，并通过私密渠道配置以下信息到 Vercel Environment Variables，不要写入仓库或群聊明文：

- Host
- Port，通常为 `4000`
- Database Name，建议生产库 `talkmate`，预览库 `talkmate_preview`
- Username
- Password
- TLS/SSL 参数或官方 Python 连接串

建议创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS talkmate CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
CREATE DATABASE IF NOT EXISTS talkmate_preview CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
```

## Vercel 环境变量

### Production

```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate?ssl_verify_cert=true&ssl_verify_identity=true
JWT_SECRET=<生产随机强密钥，至少32字符>
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
CORS_ORIGINS=https://<production-domain>
REGISTER_CAPTCHA=<生产注册验证码>
DEEPSEEK_API_KEY=<DeepSeek API Key>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=8.0
AI_MAX_HISTORY=20
```

`VITE_API_BASE_URL` 在 Vercel 同源部署中不设置或设置为空。

### Preview

```env
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/talkmate_preview?ssl_verify_cert=true&ssl_verify_identity=true
JWT_SECRET=<preview随机强密钥，至少32字符>
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
CORS_ORIGINS=https://*.vercel.app
REGISTER_CAPTCHA=<preview注册验证码>
DEEPSEEK_API_KEY=<DeepSeek API Key>
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TIMEOUT=8.0
AI_MAX_HISTORY=20
```

## 本地验证

### 后端数据库 URL 工具测试

```bash
cd backend
source venv/bin/activate
pytest app/db/tests/test_database_url.py -v
```

预期：

```text
3 passed
```

### 前端构建

```bash
cd frontend
VITE_API_BASE_URL= npm run build
```

预期：

```text
✓ built in
```

### Vercel 入口导入

```bash
python - <<'PY'
from api.index import app
print(app.title)
PY
```

预期：

```text
TalkMate API
```

## 线上验证

将 `<vercel-domain>` 替换为实际域名。

### 健康检查

```bash
curl -s https://<vercel-domain>/api/health
```

预期：

```json
{"code":0,"message":"success","data":{"status":"ok","service":"talkmate-backend","version":"0.1.0"}}
```

### SPA 路由刷新

```bash
curl -I https://<vercel-domain>/login
curl -I https://<vercel-domain>/app/home
curl -I https://<vercel-domain>/practice-card
```

预期均为 `200`。

### 注册登录

```bash
curl -s -X POST https://<vercel-domain>/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"verceltest001","password":"demo1234","captcha":"<REGISTER_CAPTCHA>"}'
```

预期 `code` 为 `0`。

## 风险与约束

1. `DATABASE_URL`、`JWT_SECRET`、`DEEPSEEK_API_KEY` 禁止提交到仓库。
2. `talkmate.db` 是本地 SQLite 文件，禁止提交。
3. Vercel Serverless 有冷启动和函数超时风险，AI 调用失败时前端应展示错误态。
4. 当前用 `Base.metadata.create_all()` 自动建表，MVP 可接受；正式生产长期建议改 Alembic 迁移。
5. 如果 TiDB Cloud 官方连接串需要 CA 文件，优先使用官方推荐的 Python 连接方式；CA 不应作为私密信息写入群聊。

## 回滚方案

1. Vercel 可在 Deployments 中回滚到上一个成功部署。
2. 若 TiDB 连接异常，可临时将 `DATABASE_URL` 改回已验证的数据库连接。
3. 若前端 API 异常，可设置 `VITE_API_BASE_URL` 指向已有后端公网地址后重新部署前端。
