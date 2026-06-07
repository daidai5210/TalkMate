# T-001 端到端验证报告

> 任务：T-001 项目结构 + 用户注册/登录
> 验证范围：注册 → 登录 → 刷新保持 → 登出（13 步 UI 流程）
> 验证日期：2026-06-05
> 验证人：全栈开发工程师

---

## 一、验证目标

通过 Playwright 真实浏览器自动化，验证 T-001 全栈 auth 功能在 UI 层面端到端可用：

1. 注册流程完整性（含密码强度、确认密码、验证码）
2. 登录流程完整性
3. **刷新保持登录**（Zustand persist 持久化）
4. 登出清理
5. 错误路径覆盖（错误密码、重复用户、错误验证码）
6. 路由守卫（未登录访问 / 自动跳登录）

---

## 二、验证环境

| 项 | 值 |
|------|------|
| Backend | uvicorn 0.32 + FastAPI 0.115 + SQLAlchemy 2.0 + SQLite |
| Backend 端口 | **8769**（8000 被 project-tracker 占用，README 注明） |
| Frontend | Vite 5.4 + React 18 + TS 5.6 + Zustand 4.5 |
| Frontend 端口 | 5173 |
| Frontend API | `VITE_API_BASE_URL=http://127.0.0.1:8769` |
| 浏览器 | Chromium headless (Playwright 1.60.0) |
| 测试用户 | `e2e_<timestamp>`（每轮唯一，避免冲突） |

---

## 三、验证步骤（13 步）

| # | 步骤 | 断言 |
|---|------|------|
| 1 | 打开 /register | URL 正确，TalkMate 标题可见 |
| 2 | 填写注册表单（用户名/密码/确认/验证码） | 表单可填写 |
| 3 | 提交注册 | 跳转 /login |
| 4 | 在 /login 填写已注册用户 | 表单可填写 |
| 5 | 提交登录 | 跳转 /，localStorage 有 token |
| 6 | 验证首页 | 显示用户名 |
| 7 | **刷新页面** | URL 仍 /，token 未变，用户名仍显示 |
| 8 | 点击登出 | 跳转 /login |
| 9 | 验证清理 | localStorage token 为 null |
| 10 | 未登录访问 / | 自动跳 /login |
| 11 | 错误密码登录 | 显示"密码错误" |
| 12 | 重复用户名注册 | 显示"用户名已存在" |
| 13 | 错误验证码注册 | 显示"验证码错误" |

---

## 四、运行方式

### 4.1 启动后端（端口 8769）

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
DATABASE_URL="sqlite:///./talkmate.db" \
  JWT_SECRET="e2e-test-secret" \
  uvicorn app.main:app --host 127.0.0.1 --port 8769
```

### 4.2 启动前端（端口 5173）

```bash
cd /home/user13/Desktop/talkmate/frontend
echo "VITE_API_BASE_URL=http://127.0.0.1:8769" > .env
npm run dev
```

### 4.3 运行 E2E 测试

```bash
source /home/user13/playwright-env/bin/activate
cd /home/user13/Desktop/talkmate
python3 tests/e2e/test_auth_e2e.py
```

### 4.4 预期输出

```
=== 1. 打开 /register ===
  ✅ URL 是 /register
=== 2. 填写注册表单并提交 ===
  ...
=== 13. 验证错误验证码注册 ===
  ✅ 错误验证码显示错误提示

=== 🎉 全部 13 步 E2E 验证通过 ===
```

### 4.5 截图证据

测试过程中保存 13 张截图到 `/tmp/talkmate-e2e-screenshots/`：

- `01-register-empty.png` — 注册页空表单
- `02-register-filled.png` — 填好注册信息
- `03-after-register.png` — 注册成功跳转
- `04-login-filled.png` — 登录页填好
- `05-home-after-login.png` — 登录成功首页
- `07-after-refresh.png` — **刷新后仍登录**
- `08-after-logout.png` — 登出后回登录页
- `11-wrong-password.png` — 错误密码提示
- `12-duplicate-user.png` — 重复用户提示
- `13-bad-captcha.png` — 错误验证码提示
- `FAILURE.png` — 失败时自动保存

---

## 五、自动化单元测试（已通过）

| 层 | 文件 | 用例数 | 状态 |
|------|------|------:|------|
| Backend | `backend/app/modules/auth/tests/test_auth.py` | 9 | ✅ 全通过 |
| Frontend | `frontend/...` (无单元测试，UI 由 E2E 覆盖) | - | - |

Backend 9 个 pytest 覆盖：
- `test_health` — 健康检查
- `test_register_login_logout_flow` — 完整流程
- `test_register_duplicate_username` — code 1005
- `test_register_invalid_captcha` — code 1006
- `test_login_wrong_password` — code 1002
- `test_login_user_not_found` — code 1001
- `test_logout_without_token` — 401
- `test_logout_invalid_token` — 401
- `test_register_validation` — 422

---

## 六、验收对照（DoD 6 条）

| DoD 验收项 | 验证方式 | 状态 |
|-----------|---------|------|
| 用户能用账号密码注册（含简单验证码） | E2E 步骤 1-3 + 步骤 13（错误路径） | ✅ |
| 用户能用账号密码登录，返回 JWT | E2E 步骤 4-5 + Backend 9 用例 | ✅ |
| 登录后刷新页面保持登录状态 | **E2E 步骤 7 关键测试** | ✅ |
| 点击登出清除会话 | E2E 步骤 8-9 | ✅ |
| 密码使用 bcrypt 加密 | Backend `core/security.py` `hash_password` 用 passlib bcrypt | ✅ |
| 新增 docs/api/auth.md 接口文档 | `docs/api/auth.md` 9 章节 | ✅ |

---

## 七、风险与后续

| 风险/限制 | 影响 | 建议 |
|----------|------|------|
| Backend 8769 端口（非默认 8000） | 联调需用自定义 VITE_API_BASE_URL | 协调释放 8000 或全局统一为 8769 |
| Captcha 固定值 `1234` | MVP 简化，无安全防护 | v0.2 增加图形验证码或短信验证 |
| Token 仅前端 localStorage 存储 | 存在 XSS 风险 | v0.2 改 httpOnly cookie |
| 登出无服务端黑名单 | 旧 token 7 天内仍可使用 | v0.2 引入 Redis 黑名单 |

---

## 八、关联文档

- [`../api/auth.md`](../api/auth.md) - Auth API 接口规范
- [`../architecture/tech-stack.md`](../architecture/tech-stack.md) - 技术选型
- [`./t-001-do-r.md`](./) - DoR 任务说明
- Git: `feat/talkmate-005-docs-e2e` 分支

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：13 步 E2E 验证报告 | 全栈开发工程师 |
