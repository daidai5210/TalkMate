"""T-001 端到端验证：注册 → 登录 → 刷新保持 → 登出。

依赖: playwright 1.60+,已安装在 /home/user13/playwright-env/
运行: 需要 backend uvicorn + frontend vite dev 同时运行
- backend: 端口 8769(8000 被 project-tracker 占用,可在 .env 调整)
- frontend: 端口 5173,环境变量 VITE_API_BASE_URL=http://127.0.0.1:8769
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
API_BASE = os.environ.get("E2E_API_BASE", "http://127.0.0.1:8769")
TEST_USER = f"e2e_{int(time.time())}"
TEST_PASSWORD = "E2EPass123"
TEST_CAPTCHA = "1234"

SCREENSHOT_DIR = Path("/tmp/talkmate-e2e-screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def step(name: str) -> None:
    print(f"\n=== {name} ===", flush=True)


def assert_eq(actual, expected, label: str) -> None:
    if actual != expected:
        print(f"  ❌ {label}: expected {expected!r}, got {actual!r}")
        sys.exit(1)
    print(f"  ✅ {label}: {actual!r}")


def test_register_login_refresh_logout(page: Page) -> None:
    step("1. 打开 /register")
    page.goto(f"{BASE_URL}/register")
    page.screenshot(path=str(SCREENSHOT_DIR / "01-register-empty.png"))
    expect(page.get_by_role("heading", name="TalkMate")).to_be_visible()
    assert_eq(page.url.endswith("/register"), True, "URL 是 /register")

    step("2. 填写注册表单并提交")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", TEST_CAPTCHA)
    page.screenshot(path=str(SCREENSHOT_DIR / "02-register-filled.png"))
    page.click("button[type=submit]")

    step("3. 验证注册成功跳转到 /login")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "03-after-register.png"))
    assert_eq(page.url, f"{BASE_URL}/login", "URL 已跳转到 /login")

    step("4. 在 /login 填写表单并提交")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.screenshot(path=str(SCREENSHOT_DIR / "04-login-filled.png"))
    page.click("button[type=submit]")

    step("5. 验证登录成功跳转到 / 并检查 token")
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "05-home-after-login.png"))
    assert_eq(page.url, f"{BASE_URL}/", "URL 是 /")
    token = page.evaluate("localStorage.getItem('talkmate_token')")
    assert token is not None and len(token) > 20, f"localStorage token 存在: {token[:30]}..."
    print(f"  ✅ localStorage token 已设置: {token[:30]}...")

    step("6. 验证页面显示用户名")
    page.wait_for_selector(f"text={TEST_USER}", timeout=5000)
    assert_eq(True, True, f"首页显示用户名 {TEST_USER}")

    step("7. 刷新页面验证 token 持久化")
    page.reload()
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "07-after-refresh.png"))
    assert_eq(page.url, f"{BASE_URL}/", "刷新后仍在 /(未被踢到 /login)")
    token_after = page.evaluate("localStorage.getItem('talkmate_token')")
    assert_eq(token_after, token, "刷新后 token 未变")
    page.wait_for_selector(f"text={TEST_USER}", timeout=5000)
    assert_eq(True, True, "刷新后用户名仍显示")

    step("8. 点击登出按钮")
    page.click("button:has-text('登出')")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "08-after-logout.png"))
    assert_eq(page.url, f"{BASE_URL}/login", "登出后跳转到 /login")

    step("9. 验证 token 已从 localStorage 清除")
    token_cleared = page.evaluate("localStorage.getItem('talkmate_token')")
    assert token_cleared is None, f"token 应为 None,实际: {token_cleared}"
    print("  ✅ localStorage token 已清除")

    step("10. 验证清除后再访问 / 自动跳转到 /login")
    page.goto(f"{BASE_URL}/")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    assert_eq(page.url, f"{BASE_URL}/login", "未登录访问 / 自动跳 /login")

    step("11. 验证错误密码登录")
    page.fill("#username", TEST_USER)
    page.fill("#password", "WrongPass1")
    page.click("button[type=submit]")
    page.wait_for_selector("text=密码错误", timeout=5000)
    page.screenshot(path=str(SCREENSHOT_DIR / "11-wrong-password.png"))
    assert_eq(True, True, "错误密码显示错误提示")

    step("12. 验证重复用户名注册")
    page.goto(f"{BASE_URL}/register")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", TEST_CAPTCHA)
    page.click("button[type=submit]")
    page.wait_for_selector("text=用户名已存在", timeout=5000)
    page.screenshot(path=str(SCREENSHOT_DIR / "12-duplicate-user.png"))
    assert_eq(True, True, "重复用户名显示错误提示")

    step("13. 验证错误验证码注册")
    page.goto(f"{BASE_URL}/register")
    page.fill("#username", f"{TEST_USER}_new")
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", "0000")
    page.click("button[type=submit]")
    page.wait_for_selector("text=验证码错误", timeout=5000)
    page.screenshot(path=str(SCREENSHOT_DIR / "13-bad-captcha.png"))
    assert_eq(True, True, "错误验证码显示错误提示")

    print("\n=== 🎉 全部 13 步 E2E 验证通过 ===\n")


def main() -> None:
    print(f"E2E base URL: {BASE_URL}")
    print(f"E2E API base: {API_BASE}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_register_login_refresh_logout(page)
        except Exception as e:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"))
            print(f"\n❌ E2E 失败: {e}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
