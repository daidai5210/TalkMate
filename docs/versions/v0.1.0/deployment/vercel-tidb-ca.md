# Vercel Serverless TiDB CA 注入说明

## 背景

TalkMate 在 Vercel Serverless 运行时无法访问开发机本地的 CA 文件路径，因此不能将本地 `ca_path` 直接写入 `DATABASE_URL`。为支持 TiDB Cloud TLS/CA 校验，后端支持通过 Vercel 环境变量注入 CA PEM 内容，并在运行时写入 `/tmp/tidb-ca.pem`。

## 新增环境变量

| Key | 环境 | 说明 |
| --- | --- | --- |
| `TIDB_CA_PEM` | Preview / Production | TiDB Cloud CA 证书 PEM 内容。该值必须作为 Vercel Secret/Environment Variable 私密配置，不得提交到仓库，不得在日志或群聊中输出。 |
| `TIDB_CA_PEM_B64` | Preview / Production | TiDB Cloud CA 证书 PEM 内容的 base64 单行编码。用于 Vercel CLI 不便写入多行 PEM 的场景。优先级低于 `TIDB_CA_PEM`，不得提交或输出 value。 |

## 运行时行为

1. 后端启动创建 SQLAlchemy engine 时优先读取 `TIDB_CA_PEM`。
2. 当 `TIDB_CA_PEM` 不存在且 `TIDB_CA_PEM_B64` 存在时，后端会先 base64 解码得到 PEM 内容。
3. 当 `DATABASE_URL` 使用 `mysql` / `mysql+pymysql` 且存在任一 CA env 时，后端将 PEM 内容写入 `/tmp/tidb-ca.pem`。
4. SQLAlchemy 通过 PyMySQL `connect_args={"ssl": {"ca": "/tmp/tidb-ca.pem"}}` 使用该运行时 CA 文件。
5. 当两个 CA env 都不存在时，MySQL/TiDB 连接仅保留 `pool_pre_ping=True`，不注入本地 CA 路径。
6. SQLite 本地开发与测试仍使用 `check_same_thread=False`，不受 `TIDB_CA_PEM` / `TIDB_CA_PEM_B64` 影响。

## 配置边界

- 不提交 CA 文件。
- 不提交任何密钥 value。
- `DATABASE_URL` 仍通过 Vercel 环境变量配置。
- `TIDB_CA_PEM` / `TIDB_CA_PEM_B64` 仅作为运行时 CA 内容来源。
- 推荐在 Vercel CLI 场景使用 `TIDB_CA_PEM_B64`，避免多行 PEM 写入失败。
- Vercel `/tmp` 是 Serverless 运行时可写临时目录，适合写入当前函数实例所需的临时 CA 文件。

## S2-Deploy 后续环境变量清单

S2-CA 合并或叠加后，S2-Deploy Preview 至少需要确认以下 key：

- `DATABASE_URL`
- `TIDB_CA_PEM_B64`（推荐用于 CLI 写入；如使用 `TIDB_CA_PEM` 则二选一即可）
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `JWT_EXPIRE_DAYS`
- `CORS_ORIGINS`
- `REGISTER_CAPTCHA`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_TIMEOUT`
- `AI_MAX_HISTORY`

`VITE_API_BASE_URL` 在同源 Vercel 部署中应保持不设置或为空。
