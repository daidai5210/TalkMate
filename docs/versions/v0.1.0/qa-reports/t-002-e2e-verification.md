# T-002 端到端验证报告

> 任务：T-002 场景选择页面
> 验证范围：注册 → 登录 → 首页 → 5 场景卡片 → 点击跳转 → 登出
> 验证日期：2026-06-05
> 验证人：全栈开发工程师

---

## 一、验证目标

通过 Playwright 真实浏览器自动化，验证 T-002 全栈场景功能在 UI 层面端到端可用：

1. 首页 5 场景卡片正确展示
2. 场景排序与 sort_order 一致
3. 导航栏含用户头像 + 用户名 + 登出按钮
4. 点击场景卡片跳转对话占位页
5. 路由守卫（未登录访问 / 自动跳登录）
6. 登出后 token 清除 + 受保护路由失效

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
| 测试用户 | `scen_e2e_<timestamp>`（每轮唯一） |

---

## 三、验证步骤（10 步）

| # | 步骤 | 断言 |
|---|------|------|
| 1 | 注册新用户 | 跳转 /login |
| 2 | 登录 | 跳转 / |
| 3 | 等待场景加载 | 5 张卡片渲染 |
| 4 | 验证场景名 | 面试/点餐/会议/旅行/日常（按 sort_order） |
| 5 | 验证导航栏 | 头像存在 + 用户名显示 |
| 6 | 点击第 1 卡片 | 跳转 /conversation/1，占位页渲染 |
| 7 | 返回场景选择 | 跳转 / |
| 8 | 点击第 3 卡片 | 跳转 /conversation/3 |
| 9 | 返回 + 登出 | 跳转 /login，token 清除 |
| 10 | 验证未登录访问 / | 自动跳 /login |

---

## 四、E2E 过程发现并修复的 bug

### Bug: HomePage useEffect 无限循环

**现象**：E2E 步骤 3 超时，无法看到场景列表。BE 日志显示 `/api/v1/scenarios` 被无限重复调用。

**根因**：

```typescript
useEffect(() => {
  if (!fetched) fetchScenarios();
  return () => { reset(); };  // ← 清理函数调 reset
}, [fetched, fetchScenarios, reset]);
```

循环链：
1. Mount → `fetched=false` → 调用 `fetchScenarios()` → setState `fetched=true`
2. 重渲染，deps 中 `fetched` 变化 → cleanup 跑 → `reset()` → setState `fetched=false`
3. 重渲染，`fetched=false` → 再次调用 `fetchScenarios()`
4. 死循环

**修复**：删除 cleanup 中的 `reset()` 调用，store 状态保留到下次 mount 或 logout 触发。

```typescript
useEffect(() => {
  if (!fetched) fetchScenarios();
}, [fetched, fetchScenarios]);
```

修复后 E2E 步骤 3 通过，5 场景正常渲染。

---

## 五、运行方式

### 5.1 启动后端（端口 8769）

```bash
cd /home/user13/Desktop/talkmate/backend
source venv/bin/activate
DATABASE_URL="sqlite:///./talkmate.db" \
  JWT_SECRET="t002-e2e-secret" \
  CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" \
  uvicorn app.main:app --host 0.0.0.0 --port 8769
```

### 5.2 启动前端（端口 5173）

```bash
cd /home/user13/Desktop/talkmate/frontend
echo "VITE_API_BASE_URL=http://127.0.0.1:8769" > .env
npm run dev
```

### 5.3 运行 E2E 测试

```bash
source /home/user13/playwright-env/bin/activate
cd /home/user13/Desktop/talkmate
python3 tests/e2e/test_scenario_e2e.py
```

### 5.4 预期输出

```
=== 1. 注册新用户 ===
  ✅ 注册后跳转到 /login: '...'
=== ...
=== 10. 验证 token 失效后访问首页跳登录 ===
  ✅ 未登录访问 / 自动跳 /login: '...'

=== 🎉 T-002 全部 10 步 E2E 验证通过 ===
```

### 5.5 截图证据

`/tmp/talkmate-t002-screenshots/`：
- `01-home-with-scenarios.png` — 首页 + 5 卡片
- `02-conversation-placeholder.png` — 对话占位页
- `FAILURE.png` — 失败时自动保存

---

## 六、自动化单元测试

| 层 | 文件 | 用例数 | 状态 |
|------|------|------:|------|
| Backend scenario | `backend/app/modules/scenario/tests/test_scenario.py` | 5 | ✅ |
| Backend auth（回归） | `backend/app/modules/auth/tests/test_auth.py` | 9 | ✅ |

合计 **14/14 通过**。

Scenario 5 用例覆盖：
- 未认证拒绝（401 + code 1004）
- 非法 token 拒绝（401）
- 有效 token 返回 5 场景
- 字段完整（id/name/description/icon）
- 排序按 sort_order（面试/点餐/会议/旅行/日常）

---

## 七、DoD 验收对照（8 项）

| DoD 项 | 验证方式 | 状态 |
|--------|---------|------|
| 首页展示 5 场景卡片 | E2E 步骤 3 | ✅ |
| 每卡片含图标 + 名称 + 描述 + 开始按钮 | E2E 步骤 4 + ScenarioCard 组件 | ✅ |
| 点击卡片创建对话并进入对话页 | E2E 步骤 6（T-003 实施时真创建） | 🟡 占位 |
| 种子数据通过数据库初始化写入 | seed.py + lifespan + 5 场景返回 | ✅ |
| 导航栏显示用户头像和退出按钮 | E2E 步骤 5 + NavBar 组件 | ✅ |
| 首页空态展示 | ScenarioListEmpty 子组件 | ✅ |
| Loading 状态 | ScenarioListSkeleton 骨架屏 | ✅ |
| Error 状态 | 红色错误卡片 + 重试按钮 | ✅ |

7/8 完整通过，1/8 标记为"占位等待 T-003"。

---

## 八、风险与后续

| 风险/限制 | 影响 | 建议 |
|----------|------|------|
| 对话占位页是空操作 | 用户点击场景无实质对话 | T-003 实施真实创建对话 |
| HomePage 不在状态缓存中 | 切换 tab 回来会重新请求 | 后续可加 React Query 缓存 |
| Loading 状态用 skeleton | 无品牌色定制 | 后续可加 brand 主题色变体 |

---

## 九、关联文档

- [`../api/scenarios.md`](../api/scenarios.md) - Scenarios API 接口规范
- [`../api/auth.md`](../api/auth.md) - 鉴权依赖
- [`../architecture/tech-stack.md`](../architecture/tech-stack.md) - 技术选型
- Git: `feat/talkmate-008-scenario-docs-e2e` 分支

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|------|----------|--------|
| 2026-06-05 | 初始版本：10 步 E2E + 1 个 useEffect bug 修复 | 全栈开发工程师 |
