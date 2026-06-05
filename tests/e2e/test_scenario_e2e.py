"""T-002 端到端验证：登录 → 首页 → 5 场景卡片 → 跳转对话占位 → 登出。

依赖: playwright 1.60+,已安装在 /home/user13/playwright-env/
运行: 需要 backend uvicorn + frontend vite dev 同时运行
- backend: 端口 8769(8000 已被 project-tracker 占用)
- frontend: 端口 5173,环境变量 VITE_API_BASE_URL=http://127.0.0.1:8769
"""
import os
import sys
import time
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:5173")
API_BASE = os.environ.get("E2E_API_BASE", "http://127.0.0.1:8769")
TEST_USER = f"scen_e2e_{int(time.time())}"
TEST_PASSWORD = "ScenE2E123"

SCREENSHOT_DIR = Path("/tmp/talkmate-t002-screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def step(name: str) -> None:
    print(f"\n=== {name} ===", flush=True)


def assert_eq(actual, expected, label: str) -> None:
    if actual != expected:
        print(f"  ❌ {label}: expected {expected!r}, got {actual!r}")
        sys.exit(1)
    print(f"  ✅ {label}: {actual!r}")


def assert_true(condition, label: str) -> None:
    if not condition:
        print(f"  ❌ {label}")
        sys.exit(1)
    print(f"  ✅ {label}")


def test_scenario_full_flow(page: Page) -> None:
    step("1. 注册新用户")
    page.goto(f"{BASE_URL}/register")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.fill("#confirm", TEST_PASSWORD)
    page.fill("#captcha", "1234")
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    assert_eq(page.url, f"{BASE_URL}/login", "注册后跳转到 /login")

    step("2. 登录")
    page.fill("#username", TEST_USER)
    page.fill("#password", TEST_PASSWORD)
    page.click("button[type=submit]")
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    assert_eq(page.url, f"{BASE_URL}/", "登录后跳转到 /")

    step("3. 等待场景加载并验证 5 张卡片")
    page.wait_for_selector('[data-testid="scenario-list"]', timeout=10000)
    cards = page.locator('[data-testid^="scenario-card-"]')
    count = cards.count()
    page.screenshot(path=str(SCREENSHOT_DIR / "01-home-with-scenarios.png"))
    assert_eq(count, 5, f"场景卡片数量为 5(实际 {count})")

    step("4. 验证 5 个场景名(面试/点餐/会议/旅行/日常)")
    expected_names = ["面试", "点餐", "会议", "旅行", "日常"]
    actual_names = []
    for i in range(5):
        text = cards.nth(i).locator("h3").inner_text()
        actual_names.append(text)
    assert_eq(actual_names, expected_names, "场景名按 sort_order 排序")

    step("5. 验证导航栏显示用户头像和用户名")
    avatar = page.locator('[data-testid="user-avatar"]')
    assert_true(avatar.count() == 1, "用户头像存在")
    navbar_username = page.locator('[data-testid="navbar-username"]')
    assert_eq(navbar_username.inner_text(), TEST_USER, "导航栏显示用户名")

    step("6. 点击第 1 个场景卡片(面试)")
    cards.nth(0).click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    page.screenshot(path=str(SCREENSHOT_DIR / "02-conversation-placeholder.png"))
    assert_true("/conversation/" in page.url, f"跳转到对话占位页(URL: {page.url})")
    placeholder = page.locator('[data-testid="conversation-placeholder"]')
    assert_true(placeholder.count() == 1, "对话占位页渲染")

    step("7. 点击返回场景选择")
    page.click('[data-testid="back-to-home"]')
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    assert_eq(page.url, f"{BASE_URL}/", "返回首页")

    step("8. 验证点击第 3 个场景(会议)也跳转正常")
    cards.nth(2).click()
    page.wait_for_url(lambda url: "/conversation/" in url, timeout=10000)
    assert_true("/conversation/3" in page.url, f"跳转到 /conversation/3(URL: {page.url})")

    step("9. 返回并点击登出")
    page.go_back()
    page.wait_for_url(f"{BASE_URL}/", timeout=10000)
    page.click('[data-testid="logout-button"]')
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    assert_eq(page.url, f"{BASE_URL}/login", "登出后跳转到 /login")
    token = page.evaluate("localStorage.getItem('talkmate_token')")
    assert_true(token is None, "localStorage token 已清除")

    step("10. 验证 token 失效后访问首页跳登录")
    page.goto(f"{BASE_URL}/")
    page.wait_for_url(f"{BASE_URL}/login", timeout=10000)
    assert_eq(page.url, f"{BASE_URL}/login", "未登录访问 / 自动跳 /login")

    print("\n=== 🎉 T-002 全部 10 步 E2E 验证通过 ===\n")


def main() -> None:
    print(f"E2E base URL: {BASE_URL}")
    print(f"E2E API base: {API_BASE}")
    print(f"Test user: {TEST_USER}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_scenario_full_flow(page)
        except Exception as e:
            page.screenshot(path=str(SCREENSHOT_DIR / "FAILURE.png"))
            print(f"\n❌ E2E 失败: {e}")
            raise
        finally:
            browser.close()


if __name__ == "__main__":
    main()
