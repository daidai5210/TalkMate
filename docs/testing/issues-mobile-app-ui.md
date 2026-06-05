# 手机端 App 化体验缺陷清单

> 状态：执行中  
> 阶段：S5 联调验证  
> 日期：2026-06-05  

## Issue 模板

```text
Issue：
优先级：[P0/P1/P2/P3]
页面/模块：
复现步骤：
实际结果：
预期结果：
证据：
影响范围：
修复建议：
状态：[open/fixed/verified/deferred]
```

## 当前缺陷

### MUI-ISSUE-001

Issue：MUI-ISSUE-001  
优先级：P1  
页面/模块：登录页、注册页 Auth 切换入口  
复现步骤：

1. 启动前后端测试服务。
2. 执行 `tests/e2e/test_mobile_layout_e2e.py`。
3. 在 375x812 视口检查 `/login`。

实际结果：

- 登录页 “去注册” 是内联文字链接，高度约 16px。
- 多视口布局测试失败：`no tiny visible controls [{'tag': 'A', 'text': '去注册', 'height': 16}]`。

预期结果：

- 手机端可点击入口高度应满足移动触控目标，至少不低于 36px，关键入口建议 44px。
- 登录页 “去注册” 和注册页 “去登录” 应使用移动端可点击按钮/胶囊样式。

证据：

- `evidence/2026-06-05-mobile-app-ui/layout/iphone-se-width-login.png`

影响范围：

- 影响未注册用户和已有账号用户在手机端切换认证流程的可点性。

修复建议：

- 将登录/注册底部文本链接改为 `inline-flex min-h-11` 或整行次按钮，保持视觉权重低于主按钮。

修复记录：

- 修复方式：将登录页“还没有账号？去注册”和注册页“已有账号？去登录”从内联小链接改为 `inline-flex min-h-11` 的次级胶囊按钮。
- 修复文件：`frontend/src/features/auth/LoginPage.tsx`、`frontend/src/features/auth/RegisterPage.tsx`
- 定向复测：`tests/e2e/test_mobile_layout_e2e.py`
- 复测结果：通过，所有视口无横向滚动且无过小可见控件。

状态：verified
