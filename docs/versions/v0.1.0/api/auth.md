# TalkMate Auth API 文档

> 版本：v0.1.0  
> 关联任务：T-001（PR-001 ~ PR-004 拆分实现）  
> 日期：2026-06-05

---

## 一、概述

Auth 模块负责用户注册、登录、登出与会话管理。会话基于 JWT，有效期 7 天，客户端需在请求头携带。

本 API 严格遵循 [`./api-design.md`](./api-design.md) 中的统一响应格式与错误码规范。

---

## 二、统一约定

### 2.1 响应格式

成功：
```json
{ "code": 0, "message": "success", "data": { ... } }
```

错误：
```json
{ "code": 1001, "message": "错误描述", "data": null }
```

### 2.2 认证方式

- 请求头：`Authorization: Bearer <token>`
- 缺失或非法 token：HTTP 401，`code: 1004`
- token 过期：HTTP 401，`code: 1003`

### 2.3 字符集

请求与响应均为 UTF-8 JSON。

---

## 三、接口

### 1. 用户注册

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/auth/register` |
| 认证 | 否 |

**请求体**：

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| username | string | ✅ | 3-50 字符，字母数字下划线 |
| password | string | ✅ | 8-32 字符，必须包含字母和数字 |
| captcha | string | ✅ | 4 位数字，MVP 固定值 `1234` |

**成功响应（201）**：
```json
{
  "code": 0,
  "message": "注册成功",
  "data": { "id": 1, "username": "zhangsan", "created_at": "2026-06-05T00:00:00" }
}
```

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1005 | 用户名已存在 | 同名活跃用户已存在 |
| 1006 | 验证码错误 | captcha 与 `REGISTER_CAPTCHA`（默认 `1234`）不匹配 |
| 9001 | 必填项缺失 | username/password/captcha 缺失 |
| 9002 | 格式错误 | username 不符合正则 / password 长度不达标 |

---

### 2. 用户登录

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/auth/login` |
| 认证 | 否 |

**请求体**：

| 字段 | 类型 | 必填 |
|------|------|------|
| username | string | ✅ |
| password | string | ✅ |

**成功响应（200）**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "zhangsan", "created_at": "2026-06-05T00:00:00" }
  }
}
```

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1001 | 用户名不存在 | username 不在 users 表 |
| 1002 | 密码错误 | bcrypt 校验失败 |

---

### 3. 用户登出

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/auth/logout` |
| 认证 | **是** |

**请求体**：无

**成功响应（200）**：
```json
{ "code": 0, "message": "登出成功", "data": null }
```

**错误码**：

| code | 含义 | 触发条件 |
|------|------|----------|
| 1003 | Token 过期 | JWT exp 已过 |
| 1004 | Token 无效 | 缺失 / 伪造 / 签名错误 / 用户已删除 |

> MVP 实现说明：登出为无状态操作，服务端仅校验 token 合法性。客户端需在收到成功响应后清除本地 token。后续版本将引入 token 黑名单。

---

## 四、错误码汇总

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1001 | 用户名不存在 |
| 1002 | 密码错误 |
| 1003 | Token 过期 |
| 1004 | Token 无效 |
| 1005 | 用户名已存在 |
| 1006 | 验证码错误 |
| 9001 | 必填项缺失 |
| 9002 | 格式错误 |

---

## 五、字段长度限制

| 字段 | 最小 | 最大 | 正则 |
|------|------|------|------|
| username | 3 | 50 | `^[A-Za-z0-9_]{3,50}$` |
| password | 8 | 32 | 必须含字母 + 数字 |
| captcha | 4 | 4 | 4 位数字 |

---

## 六、JWT 流程

```
[Client]                          [Server]
  |                                  |
  |---POST /register--------------->|
  |<--201 { user }------------------|   (无 token)
  |                                  |
  |---POST /login------------------>|
  |<--200 { token, user }-----------|   (bcrypt 校验 → JWT 签发)
  |                                  |
  |  (client saves token in         |
  |   localStorage)                  |
  |                                  |
  |---POST /logout (Bearer)-------->|
  |  Authorization: Bearer <token>   |
  |<--200 { code: 0 }----------------|   (服务端校验 token,客户端清除)
  |                                  |
  |---[401 任意受保护接口]---------->|   (token 过期/无效 → 自动跳 /login)
```

### 6.1 Token Payload

```json
{
  "sub": "1",
  "exp": 1781225734
}
```

- `sub`：用户 ID（字符串形式的整数）
- `exp`：过期时间（Unix timestamp，默认 7 天）

### 6.2 密钥配置

通过 `.env` 文件：

```bash
JWT_SECRET=please-change-me-in-production-use-a-long-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7
```

> ⚠️ 生产环境必须使用强随机密钥，并通过密钥管理服务注入。

---

## 七、cURL 示例

```bash
# 注册
curl -X POST http://127.0.0.1:8769/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"Test1234","captcha":"1234"}'

# 登录（提取 token）
TOKEN=$(curl -s -X POST http://127.0.0.1:8769/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"zhangsan","password":"Test1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 登出
curl -X POST http://127.0.0.1:8769/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

---

## 八、客户端集成示例（React + TypeScript）

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('talkmate_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('talkmate_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
```

---

## 九、关联文档

- [`./api-design.md`](./api-design.md) - 全局 API 设计
- [`../database/schema.md`](../database/schema.md) - users 表结构
- [`../architecture/tech-stack.md`](../architecture/tech-stack.md) - 技术选型
- [`../qa-reports/t-001-e2e-verification.md`](../qa-reports/t-001-e2e-verification.md) - E2E 验证报告

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：T-001 三个 auth 端点 | 全栈开发工程师 |
