# Phase 1 / MVP 部署与运行支持说明

> 供 QA / OPS 部署验证使用  
> 来源：全栈开发  
> 日期：2026-06-05

---

## 一、运行端口

| 服务 | 端口 | 绑定 |
|------|------|------|
| 前端 dev (vite) | 5173 | 0.0.0.0 |
| 前端 preview (vite build) | 4173/4174 | 0.0.0.0 |
| 后端 uvicorn | 8000 | 0.0.0.0 |
| 副项目 project-tracker | 8001 | 0.0.0.0（与本项目无关，避免冲突） |

公网入口：通过 frpc 暴露时建议
- `talkmate.qa.<domain>` → 后端 `127.0.0.1:8000`
- `talkmate-app.qa.<domain>` → 前端 `127.0.0.1:5173`

---

## 二、环境变量（必须注入，不入 Git）

| 变量 | 必填 | 示例 / 备注 | 来源 |
|------|------|-------------|------|
| `DATABASE_URL` | 是 | `sqlite:///./talkmate.db` | 部署规范 |
| `JWT_SECRET` | 是 | 长随机字符串 | 部署规范 |
| `JWT_ALGORITHM` | 是 | `HS256` | 默认 |
| `JWT_EXPIRE_DAYS` | 是 | `7` | 默认 |
| `CORS_ORIGINS` | 是 | 含公网前端域名 | 部署规范 |
| `REGISTER_CAPTCHA` | 是 | `1234`（MVP） | 部署规范 |
| `HOST` | 是 | `0.0.0.0` | 部署规范 |
| `PORT` | 是 | `8000` | 部署规范 |
| `DEEPSEEK_API_KEY` | 是 | `sk-...` | `.team-secrets.md` 注入 |
| `DEEPSEEK_BASE_URL` | 是 | `https://api.deepseek.com/v1` | 部署规范 |
| `DEEPSEEK_MODEL` | 是 | `deepseek-chat` | 部署规范 |
| `DEEPSEEK_TIMEOUT` | 是 | `10.0` | 部署规范 |
| `AI_MAX_HISTORY` | 否 | `20` | 默认 |
| `VITE_API_BASE_URL` | 前端 | 后端公网 URL（含 https） | 前端构建时注入 |

环境变量来源说明：
- `.team-secrets.md` 中含真实密钥，必须由负责人线下提供，不进 Git、不进公网页面、不进截图
- 写入 `backend/.env` / `frontend/.env` 后需把文件加进 `.gitignore` 防止误提交

---

## 三、启动命令（后台方式）

### 后端
```bash
cd /home/user13/Desktop/talkmate/backend
setsid bash -c 'set -a; source .env; set +a; exec ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000' \
  > /tmp/talkmate-backend.log 2>&1 < /dev/null
echo $! > /tmp/talkmate-backend.pid
```
- 启动后验证：`curl http://127.0.0.1:8000/api/health` → 200 / status=ok
- 真正 uvicorn PID 与 wrapper 不同，按 `ps -p $(cat /tmp/talkmate-backend.pid) -o args=` 校验命令确认是 `uvicorn app.main:app`

### 前端（dev）
```bash
cd /home/user13/Desktop/talkmate/frontend
setsid npm run dev -- --host 0.0.0.0 --port 5173 \
  > /tmp/talkmate-frontend-dev.log 2>&1 < /dev/null
echo $! > /tmp/talkmate-frontend-dev.pid
```

### 前端（preview 静态构建）
```bash
cd /home/user13/Desktop/talkmate/frontend
npm run build
setsid npm run preview -- --host 0.0.0.0 --port 4173 \
  > /tmp/talkmate-frontend-preview.log 2>&1 < /dev/null
echo $! > /tmp/talkmate-frontend-preview.pid
```

---

## 四、停止命令（精确 PID）

```bash
PIDFILE=/tmp/talkmate-backend.pid
pid=$(cat "$PIDFILE")
cmd=$(ps -p "$pid" -o args= 2>/dev/null || true)
case "$cmd" in
  *uvicorn*app.main*)
    pgid=$(ps -o pgid= -p "$pid" | tr -d ' ')
    kill -TERM "-$pgid" 2>/dev/null || kill -TERM "$pid"
    ;;
  *)
    echo "PID 不匹配: $cmd"; exit 1 ;;
esac
rm -f "$PIDFILE"
```

前端停止同上，匹配 `vite` 命令。

**禁止**：`pkill -f 8000`、`pkill -f vite`、`pkill -f uvicorn`、`killall node` 等宽匹配。

---

## 五、frpc 公网配置示例

```ini
[[proxies]]
name = "talkmate-backend"
type = "http"
localPort = 8000
locations = ["/"]
customDomains = ["talkmate.qa.<domain>"]

[[proxies]]
name = "talkmate-frontend"
type = "http"
localPort = 5173
locations = ["/"]
customDomains = ["talkmate-app.qa.<domain>"]
```

要点：
- 域名需有合法 DNS 解析 + frpc 服务端允许该 host
- TLS 终止建议在 frpc 服务端（Nginx）或 Cloudflare，避免上传证书到 QA 主机
- 启动 frpc 也用 setsid 后台方式，PID 写入 `/tmp/talkmate-frpc.pid`，日志 `/tmp/talkmate-frpc.log`

---

## 六、上线前 smoke 清单

| # | 项 | 验证方式 | 期望 |
|---|----|----------|------|
| 1 | 后端健康 | `GET /api/health` | 200 / status=ok |
| 2 | 前端可达 | `GET /` | 200 + HTML |
| 3 | 注册 | `POST /api/v1/auth/register` | 201 / code=0 |
| 4 | 登录 | `POST /api/v1/auth/login` | 200 / 返回 token |
| 5 | 场景列表 | `GET /api/v1/scenarios` | 200 / 含默认 5 个场景 |
| 6 | 创建对话 | `POST /api/v1/conversations` | 201 |
| 7 | 发送消息 | `POST /api/v1/conversations/:id/messages` | 200 / 含真实 AI 回复 |
| 8 | 对话详情 | `GET /api/v1/conversations/:id` | 200 / 含完整 messages |
| 9 | 生成总结 | `POST /api/v1/conversations/:id/summary` | 200 / 含 score |
| 10 | 历史列表 | `GET /api/v1/conversations` | 200 / has_summary=true, summary_score 返回 |
| 11 | 总结查看 | `GET /api/v1/conversations/:id/summary` | 200 |
| 12 | 总结空态 | 对无 summary 的对话 GET | 400 / code=3003 |
| 13 | 用户隔离 | B 用户访问 A 用户对话 | 4001 |
| 14 | 公网跨域 | 公网域名带 `Origin` 头访问 | 200 + CORS headers |

---

## 七、已知观察项

| 编号 | 现象 | 处置 |
|------|------|------|
| OBS-001 | AI 首次冷启动 1440 视口偶发 10s 超时 | 当前 `DEEPSEEK_TIMEOUT=10.0`；建议先重试一次；后续考虑前端 loading 提示与客户端重试 |
| OBS-002 | `passlib.crypt` 与 `jose.utcnow` 库 deprecation warning | 不影响功能；升级 Python 时统一处理 |
| OBS-003 | `talkmate.db` 本地 SQLite 多次因 smoke 写入修改 | 不提交 Git；公网部署建议改用独立 volume / Postgres |
| OBS-004 | T-005 STT 未在真实 Chrome + 真实麦克风下手动验证 | 上线前需补真实设备验证 |

---

## 八、回滚方式

- 代码回滚：`git checkout <last-known-good-tag>`（待 PM 决定 tag 命名）
- 数据库回滚：保留最近一次 `talkmate.db` 备份副本；若不可接受数据丢失，建议用 Postgres + 迁移脚本
- 环境变量：保留 `backend/.env` / `frontend/.env` 备份
- frpc：禁用公网域名指向新服务，恢复旧服务即可

---

## 九、不可提交 / 不可暴露清单

- `backend/.env`、`frontend/.env`
- `.team-secrets.md`
- `talkmate.db`（本地 SQLite）
- `DEEPSEEK_API_KEY` 等任何密钥
- `frontend/dist`（构建产物，可重新 build）
- `node_modules` / `venv`

公网页面 / 日志 / 截图均不得明文贴出以上内容。

---

## 更新记录

| 日期 | 更新 | 作者 |
|------|------|------|
| 2026-06-05 | 初始版本：供 QA/OPS 部署使用 | 全栈开发工程师 |
