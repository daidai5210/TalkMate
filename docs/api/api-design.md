# TalkMate API 接口设计文档

> 版本：v1.0  
> 日期：2026-06-05  

---

## 一、统一响应格式

**成功响应（200/201）：**
```json
{ "code": 0, "message": "success", "data": { ... } }
```

**列表响应（200）：**
```json
{ "code": 0, "message": "success", "data": [ ... ], "meta": { "total": 10, "page": 1, "per_page": 20 } }
```

**错误响应（4xx/5xx）：**
```json
{ "code": 1001, "message": "错误描述", "data": null, "errors": [{ "field": "username", "message": "..." }] }
```

---

## 二、HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | GET/PATCH 成功 |
| 201 | Created | POST 创建资源成功 |
| 204 | No Content | DELETE 成功 |
| 400 | Bad Request | 参数格式错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 422 | Unprocessable Entity | 参数校验失败 |
| 500 | Internal Server Error | 服务器错误 |

---

## 三、业务错误码

| 错误码 | 含义 | 接口 |
|--------|------|------|
| 0 | 成功 | 通用 |
| 1001 | 用户名不存在 | 登录 |
| 1002 | 密码错误 | 登录 |
| 1003 | Token 过期 | 通用 |
| 1004 | Token 无效 | 通用 |
| 1005 | 用户名已存在 | 注册 |
| 1006 | 验证码错误 | 注册 |
| 2001 | 场景不存在 | 对话创建 |
| 3001 | 对话不存在 | 获取对话/发消息 |
| 4001 | 无权访问 | 通用 |
| 5001 | AI 服务调用失败 | 对话 |
| 9001 | 必填项缺失 | 通用 |
| 9002 | 格式错误 | 通用 |

---

## 四、接口清单

### 1. 用户注册

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/auth/register` |
| 认证 | 否 |

**请求体：** `{ "username": "zhangsan", "password": "...", "captcha": "1234" }`  
**成功（201）：** `{ "code": 0, "message": "注册成功", "data": { "id": 1, "username": "zhangsan" } }`

### 2. 用户登录

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/auth/login` |
| 认证 | 否 |

**请求体：** `{ "username": "zhangsan", "password": "..." }`  
**成功（200）：** `{ "code": 0, "message": "登录成功", "data": { "token": "...", "user": { "id": 1, "username": "zhangsan" } } }`

### 3. 用户登出

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/auth/logout` |
| 认证 | 是 |

### 4. 获取场景列表

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/scenarios` |
| 认证 | 是 |

**返回：** 5 个场景数组 `{ id, name, description, icon }`

### 5. 创建对话

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/conversations` |
| 认证 | 是 |

**请求体：** `{ "scenario_id": 1 }`  
**成功（201）：** `{ "code": 0, "data": { "id": 1, "scenario_id": 1, "created_at": "..." } }`

### 6. 获取对话记录

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/conversations/:id` |
| 认证 | 是 |

**返回：** `{ id, scenario, messages[], created_at }`

### 7. 获取用户对话列表

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/conversations` |
| 认证 | 是 |
| 参数 | `?page=1&per_page=20` |

**返回：** 分页列表 `{ data[], meta: { total, page, per_page } }`

### 8. 发送消息（调用 AI）

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/conversations/:id/messages` |
| 认证 | 是 |

**请求体：** `{ "text": "Hello, I want to order food" }`  
**返回：** `{ user_message: { ... }, ai_message: { ... } }`

### 9. 生成总结

| 项 | 值 |
|------|------|
| 路径 | `POST /api/v1/conversations/:id/summary` |
| 认证 | 是 |

**返回：** `{ score, feedback[], suggestions[], grammar_issues, vocabulary_usage }`

### 10. 获取总结

| 项 | 值 |
|------|------|
| 路径 | `GET /api/v1/conversations/:id/summary` |
| 认证 | 是 |

### 11. 健康检查

| 项 | 值 |
|------|------|
| 路径 | `GET /api/health` |
| 认证 | 否 |

**返回：** `{ "status": "ok", "uptime": 3600, "timestamp": "..." }`

---

## 五、认证机制

JWT Token，请求头：`Authorization: Bearer <token>`  
Payload：`sub`（用户 ID），`exp`（7 天过期）

## 六、参数校验

| 接口 | 字段 | 规则 |
|------|------|------|
| 注册 | username | 3-50 字符，字母数字下划线 |
| 注册 | password | 8-32 字符 |
| 注册 | captcha | 4 位数字（MVP 固定值） |
| 发消息 | text | 1-5000 字符 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本 | 产品经理 |
